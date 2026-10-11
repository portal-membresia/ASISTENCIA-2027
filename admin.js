
const SUPABASE_URL = "https://nlaushunmdswlromtlho.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_NMOqt5Tp_91WZ0V9ZMU65Q_rOmj9ELM";

const FUNCION_URL =
    `${SUPABASE_URL}/functions/v1/consultar-asistencias`;

const formularioLogin = document.querySelector("#formularioLogin");
const codigoEquipo = document.querySelector("#codigoEquipo");
const botonLogin = document.querySelector("#botonLogin");
const mensajeLogin = document.querySelector("#mensajeLogin");

const panelAsistencias = document.querySelector("#panelAsistencias");
const filtroMes = document.querySelector("#filtroMes");
const filtroOrganizacion = document.querySelector("#filtroOrganizacion");
const mensajeRegistros = document.querySelector("#mensajeRegistros");
const tablaAsistencias = document.querySelector("#tablaAsistencias");

let organizaciones = [];
let asistencias = [];
let codigoVerificado = "";

function mostrarMensajeLogin(texto, tipo = "normal") {
    mensajeLogin.textContent = texto;
    mensajeLogin.style.color =
        tipo === "error" ? "#b42318" :
        tipo === "exito" ? "#287866" :
        "#34435c";
}

function mostrarMensajeRegistros(texto, tipo = "normal") {
    mensajeRegistros.textContent = texto;
    mensajeRegistros.style.color =
        tipo === "error" ? "#b42318" :
        tipo === "exito" ? "#287866" :
        "#34435c";
}

function obtenerMesActual() {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");

    return `${anio}-${mes}`;
}

function crearCelda(fila, contenido) {
    const celda = document.createElement("td");
    celda.textContent =
        contenido === null || contenido === undefined || contenido === ""
            ? "—"
            : String(contenido);

    fila.appendChild(celda);
}

function obtenerNombreOrganizacion(id) {
    const organizacion = organizaciones.find(
        item => String(item.id) === String(id)
    );

    return organizacion ? organizacion.nombre : "Sin organización";
}

function mostrarAsistencias() {
    const mesSeleccionado = filtroMes.value;
    const organizacionSeleccionada = filtroOrganizacion.value;

    tablaAsistencias.replaceChildren();

    const filtradas = asistencias.filter(registro => {
        const coincideMes =
            !mesSeleccionado ||
            String(registro.fecha_reunion || "").startsWith(mesSeleccionado);

        const coincideOrganizacion =
            !organizacionSeleccionada ||
            String(registro.organizacion_id) === organizacionSeleccionada;

        return coincideMes && coincideOrganizacion;
    });

    if (filtradas.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");

        celda.colSpan = 7;
        celda.textContent = "No hay registros para los filtros seleccionados.";
        celda.style.textAlign = "center";
        celda.style.padding = "24px";

        fila.appendChild(celda);
        tablaAsistencias.appendChild(fila);

        mostrarMensajeRegistros("Consulta completada: no se encontraron registros.");
        return;
    }

    filtradas.sort((a, b) =>
        String(b.fecha_reunion || "").localeCompare(
            String(a.fecha_reunion || "")
        )
    );

    filtradas.forEach(registro => {
        const fila = document.createElement("tr");

        crearCelda(fila, registro.fecha_reunion);
        crearCelda(fila, obtenerNombreOrganizacion(registro.organizacion_id));

        crearCelda(
            fila,
            registro.realizada === true ? "Sí" :
            registro.realizada === false ? "No" :
            "Sin dato"
        );

        crearCelda(fila, registro.ninos);
        crearCelda(fila, registro.maestros);
        crearCelda(fila, registro.motivo_no_realizada);
        crearCelda(fila, registro.observaciones);

        tablaAsistencias.appendChild(fila);
    });

    mostrarMensajeRegistros(
        `Consulta completada: ${filtradas.length} registro(s) encontrado(s).`,
        "exito"
    );
}

function cargarOpcionesOrganizacion() {
    filtroOrganizacion.replaceChildren();

    const todas = document.createElement("option");
    todas.value = "";
    todas.textContent = "Todas las organizaciones";
    filtroOrganizacion.appendChild(todas);

    organizaciones.forEach(organizacion => {
        const opcion = document.createElement("option");
        opcion.value = String(organizacion.id);
        opcion.textContent = organizacion.nombre;
        filtroOrganizacion.appendChild(opcion);
    });
}

async function consultarAsistencias() {
    mostrarMensajeRegistros("Consultando registros...");
    tablaAsistencias.replaceChildren();

    try {

        console.log("Organización seleccionada:", filtroOrganizacion.value);
        
        const respuesta = await fetch(FUNCION_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_PUBLISHABLE_KEY
            },
            body: JSON.stringify({
                code: codigoVerificado,
                mes: filtroMes.value || obtenerMesActual(),
                organizacion_id: filtroOrganizacion.value || null
            })
        });

        const resultado = await respuesta.json();


        console.log("Respuesta completa del servidor:", resultado);

        
        if (!Array.isArray(resultado.asistencias) ||
            !Array.isArray(resultado.organizaciones)) {
            throw new Error(
                "La función respondió, pero el formato de los datos no es el esperado."
            );
        }

        asistencias = resultado.asistencias;
        organizaciones = resultado.organizaciones;

        cargarOpcionesOrganizacion();
        mostrarAsistencias();

    } catch (error) {
        console.error("Error consultando asistencias:", error);

        tablaAsistencias.replaceChildren();

        mostrarMensajeRegistros(
            error.message || "No se pudo conectar con el servicio.",
            "error"
        );
    }
}

formularioLogin.addEventListener("submit", async function (event) {
    event.preventDefault();

    botonLogin.disabled = true;
    botonLogin.textContent = "Verificando...";
    mostrarMensajeLogin("Comprobando el código de acceso...");

    try {
        const codigoIngresado = codigoEquipo.value;

        const respuesta = await fetch(FUNCION_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_PUBLISHABLE_KEY
            },
            body: JSON.stringify({
                code: codigoIngresado,
                mes: obtenerMesActual()
            })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error || "No se pudo verificar el acceso."
            );
        }

        if (!Array.isArray(resultado.asistencias) ||
            !Array.isArray(resultado.organizaciones)) {
            throw new Error("La respuesta del servidor no tiene el formato esperado.");
        }

        codigoVerificado = codigoIngresado;
        asistencias = resultado.asistencias;
        organizaciones = resultado.organizaciones;

        filtroMes.value = obtenerMesActual();
        cargarOpcionesOrganizacion();

        panelAsistencias.hidden = false;

        mostrarMensajeLogin("Acceso verificado correctamente.", "exito");
        mostrarAsistencias();

        codigoEquipo.value = "";

        await consultarAsistencias();

    } catch (error) {
        console.error("Error de acceso:", error);

        panelAsistencias.hidden = true;

        mostrarMensajeLogin(
            error.message || "No se pudo comprobar el acceso.",
            "error"
        );
    } finally {
        botonLogin.disabled = false;
        botonLogin.textContent = "Ingresar al panel";
    }
});

filtroMes.addEventListener("change", consultarAsistencias);
filtroOrganizacion.addEventListener("change", mostrarAsistencias);
