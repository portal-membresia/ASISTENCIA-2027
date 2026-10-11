/* ==========================================
   ASISTENCIA 2027
   Conexión con Supabase
========================================== */

// 1. CONFIGURACIÓN DE SUPABASE
// Reemplace estos dos valores por los suyos.
// No use la Secret key.

const SUPABASE_URL = "https://nlaushunmdswlromtlho.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_NMOqt5Tp_91WZ0V9ZMU65Q_rOmj9ELM";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);


// 2. ELEMENTOS DEL FORMULARIO

const organizacion = document.querySelector("#organizacion");
const fecha = document.querySelector("#fecha");
const datosAsistencia = document.querySelector("#datosAsistencia");
const datosNoRealizada = document.querySelector("#datosNoRealizada");
const ninos = document.querySelector("#ninos");
const maestros = document.querySelector("#maestros");
const motivo = document.querySelector("#motivo");
const observaciones = document.querySelector("#observaciones");
const formulario = document.querySelector("#formularioAsistencia");
const botonRegistrar = document.querySelector("#botonRegistrar");
const mensaje = document.querySelector("#mensaje");


// 3. ORGANIZACIONES Y SUS DÍAS
// 0 = domingo, 3 = miércoles, 4 = jueves, 6 = sábado


const horarios = {
    "misioneritas": {
        dia: 6,
        nombreBD: "Misioneritas"
    },
    "exploradores": {
        dia: 6,
        nombreBD: "Exploradores del Rey"
    },
    "escuela-dominical": {
        dia: 0,
        nombreBD: "Escuela Dominical"
    },
    "iglesia-infantil-jueves": {
        dia: 4,
        nombreBD: "Iglesia Infantil - Jueves"
    },
    "iglesia-infantil-domingo": {
        dia: 0,
        nombreBD: "Iglesia Infantil P.M. - Domingo"
    },
    "adn-kids": {
        dia: 3,
        nombreBD: "ADN KIDS"
    }
};


const meses = [
    "enero", "febrero", "marzo", "abril",
    "mayo", "junio", "julio", "agosto",
    "septiembre", "octubre", "noviembre", "diciembre"
];


// 4. ESTADO INICIAL

datosAsistencia.style.display = "none";
datosNoRealizada.style.display = "none";

let organizacionesBD = [];
let enviando = false;


// 5. MOSTRAR MENSAJES

function mostrarMensaje(texto, tipo = "normal") {
    mensaje.textContent = texto;

    mensaje.style.color =
        tipo === "error" ? "#b42318" :
        tipo === "exito" ? "#287866" :
        "#202f59";
}


// 6. CARGAR ORGANIZACIONES DESDE SUPABASE

async function cargarOrganizaciones() {
    organizacion.disabled = true;

    try {
        const { data, error } = await supabaseClient
            .from("organizaciones")
            .select("id, nombre, dia_semana, horario");

        if (error) {
            throw error;
        }

        organizacionesBD = data || [];

        // Comprobar que estén las cinco opciones
        const faltantes = Object.entries(horarios).filter(
            ([clave, config]) => {
                return !organizacionesBD.some(item =>
                    item.nombre === config.nombreBD &&
                    Number(item.dia_semana) === config.dia
                );
            }
        );

        if (faltantes.length > 0) {
            throw new Error(
                "Falta una o más organizaciones o sus días no coinciden " +
                "con la configuración de la página. Revise la tabla organizaciones."
            );
        }

        organizacion.disabled = false;
        mostrarMensaje("Conexión lista. Puede registrar la reunión.");

    } catch (error) {
        console.error("Error cargando organizaciones:", error);

        mostrarMensaje(
            "No se pudieron cargar las organizaciones. Revise la URL, " +
            "la clave y las políticas de Supabase.",
            "error"
        );
    }
}


// 7. CAMBIO DE ORGANIZACIÓN

organizacion.addEventListener("change", function () {
    generarFechas();
    mostrarMensaje("");
});


// 8. CAMBIO DE RESPUESTA: SÍ / NO

document.querySelectorAll('input[name="realizada"]').forEach(opcion => {
    opcion.addEventListener("change", actualizarFormulario);
});

function actualizarFormulario() {
    const seleccion = document.querySelector(
        'input[name="realizada"]:checked'
    );

    datosAsistencia.style.display = "none";
    datosNoRealizada.style.display = "none";

    ninos.required = false;
    maestros.required = false;
    motivo.required = false;

    if (!seleccion) {
        return;
    }

    if (seleccion.value === "si") {
        datosAsistencia.style.display = "block";
        ninos.required = true;
        maestros.required = true;
    } else {
        datosNoRealizada.style.display = "block";
        motivo.required = true;
    }
}


// 9. GENERAR FECHAS DE REUNIONES EN 2027

function generarFechas() {
    const clave = organizacion.value;

    fecha.innerHTML = "";

    const inicial = document.createElement("option");
    inicial.value = "";
    inicial.textContent = clave
        ? "Seleccione la fecha de la reunión"
        : "Primero seleccione una organización";

    fecha.appendChild(inicial);

    if (!clave || !horarios[clave]) {
        return;
    }

    const diaBuscado = horarios[clave].dia;

    for (let mes = 0; mes < 12; mes++) {
        const diasDelMes = new Date(
            Date.UTC(2027, mes + 1, 0)
        ).getUTCDate();

        for (let dia = 1; dia <= diasDelMes; dia++) {
            const fechaActual = new Date(
                Date.UTC(2027, mes, dia)
            );

            if (fechaActual.getUTCDay() !== diaBuscado) {
                continue;
            }

            const mesNumero = String(mes + 1).padStart(2, "0");
            const diaNumero = String(dia).padStart(2, "0");
            const valor = `2027-${mesNumero}-${diaNumero}`;

            const opcion = document.createElement("option");
            opcion.value = valor;
            opcion.textContent = `${dia} de ${meses[mes]} de 2027`;

            fecha.appendChild(opcion);
        }
    }
}


// 10. VALIDAR Y GUARDAR EL REGISTRO

formulario.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (enviando) {
        return;
    }

    const clave = organizacion.value;
    const fechaSeleccionada = fecha.value;

    const seleccion = document.querySelector(
        'input[name="realizada"]:checked'
    );

    if (!clave || !horarios[clave]) {
        mostrarMensaje("Seleccione una organización.", "error");
        return;
    }

    if (!fechaSeleccionada) {
        mostrarMensaje("Seleccione la fecha de la reunión.", "error");
        return;
    }

    if (!seleccion) {
        mostrarMensaje("Indique si la reunión se realizó.", "error");
        return;
    }

    let cantidadNinos = null;
    let cantidadMaestros = null;
    let motivoSeleccionado = null;

    if (seleccion.value === "si") {
        if (
            ninos.value === "" ||
            maestros.value === "" ||
            !Number.isInteger(Number(ninos.value)) ||
            !Number.isInteger(Number(maestros.value)) ||
            Number(ninos.value) < 0 ||
            Number(maestros.value) < 0
        ) {
            mostrarMensaje(
                "Ingrese cantidades enteras de niños y maestros, iguales o mayores que cero.",
                "error"
            );
            return;
        }

        cantidadNinos = Number(ninos.value);
        cantidadMaestros = Number(maestros.value);

    } else {
        if (!motivo.value) {
            mostrarMensaje(
                "Seleccione el motivo por el cual no se realizó la reunión.",
                "error"
            );
            return;
        }

        motivoSeleccionado = motivo.value;
    }

    // Buscar el ID correcto. Iglesia Infantil tiene dos horarios
    // y cada uno debe usar su propia fila en organizaciones.

    const config = horarios[clave];

    const organizacionEncontrada = organizacionesBD.find(item =>
        item.nombre === config.nombreBD &&
        Number(item.dia_semana) === config.dia
    );

    if (!organizacionEncontrada) {
        mostrarMensaje(
            "No se encontró esta organización en Supabase. Revise la conexión.",
            "error"
        );
        return;
    }

    const registro = {
        organizacion_id: organizacionEncontrada.id,
        fecha_reunion: fechaSeleccionada,
        realizada: seleccion.value === "si",
        ninos: cantidadNinos,
        maestros: cantidadMaestros,
        motivo_no_realizada: motivoSeleccionado,
        observaciones: observaciones.value.trim() || null
    };

    enviando = true;
    botonRegistrar.disabled = true;
    botonRegistrar.textContent = "Guardando...";
    mostrarMensaje("Guardando el registro...");

    try {
        const { error } = await supabaseClient
            .from("asistencias")
            .insert([registro]);

        if (error) {
            console.error("Error de Supabase:", error);

            if (error.code === "23505") {
                throw new Error(
                    "Ya existe un registro para esta organización y fecha."
                );
            }

            if (error.code === "23503") {
                throw new Error(
                    "La organización seleccionada no coincide con la base de datos."
                );
            }

            if (error.code === "42501" || error.code === "PGRST301") {
                throw new Error(
                    "Supabase rechazó el registro por permisos. Revise las políticas RLS."
                );
            }

            throw new Error(error.message);
        }

        mostrarMensaje(
            "¡Registro guardado correctamente!",
            "exito"
        );

        formulario.reset();
        fecha.innerHTML = "";

        const opcionInicial = document.createElement("option");
        opcionInicial.value = "";
        opcionInicial.textContent =
            "Primero seleccione una organización";

        fecha.appendChild(opcionInicial);

        datosAsistencia.style.display = "none";
        datosNoRealizada.style.display = "none";

    } catch (error) {
        console.error("No se pudo guardar:", error);

        mostrarMensaje(
            "No se pudo guardar: " + error.message,
            "error"
        );

    } finally {
        enviando = false;
        botonRegistrar.disabled = false;
        botonRegistrar.textContent = "Registrar asistencia";
    }
});


// 11. INICIAR

cargarOrganizaciones();