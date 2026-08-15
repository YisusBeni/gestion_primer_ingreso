/* ============================================================
   CONFIGURACIÓN
   ============================================================ */

// Pega aquí la URL /exec que te da Apps Script al publicar el Web App
// (Implementar > Nueva implementación > Aplicación web > Acceso: Cualquier usuario)
const WEB_APP_URL="https://script.google.com/macros/s/AKfycbwzbC2u_A4_EL9mAR_Xxu3HY39S5RiYOxpmYv8UF2jGntYyeWgM-DEWU6NDRphjEqlh/exec";

// Metas usadas SOLO si tu hoja EQUIPOS no define metas (respaldo)
const METAS_RESPALDO = {
    presencial: 705,
    virtual: 370,
    distancia: 100
};

/* ============================================================
   CARGA DE DATOS
   ============================================================ */

async function cargarDatos() {
    try {
        const resp = await fetch(WEB_APP_URL);
        if (!resp.ok) throw new Error("Respuesta HTTP " + resp.status);
        const data = await resp.json();
        renderizarDashboard(data);
    } catch (err) {
        console.error("Error cargando datos del Apps Script:", err);
        document.getElementById("teams-container").innerHTML =
            '<p style="grid-column:1/3;text-align:center;color:#c00;">No se pudieron cargar los datos. Revisa la URL del Web App en scripts.js.</p>';
    }
}

/* ============================================================
   RENDER PRINCIPAL
   ============================================================ */

function renderizarDashboard(data) {

    if (data.periodo) {
        document.getElementById("periodo-texto").textContent = "PERIODO " + data.periodo;
    }

    // --- Metas globales: si vienen en el JSON (sumadas desde EQUIPOS) se usan,
    // si no, se cae a METAS_RESPALDO ---
    const metaPresencial = data.metas?.presencial ?? METAS_RESPALDO.presencial;
    const metaVirtual = data.metas?.virtual ?? METAS_RESPALDO.virtual;
    const metaDistancia = data.metas?.distancia ?? METAS_RESPALDO.distancia;

    const presencial = data.presencial ?? 0;
    const virtual = data.virtual ?? 0;
    const distancia = data.distancia ?? 0;
    const total = presencial + virtual + distancia;
    const metaTotal = metaPresencial + metaVirtual + metaDistancia;

    pintarMeta("presencial", presencial, metaPresencial);
    pintarMeta("virtual", virtual, metaVirtual);
    pintarMeta("distancia", distancia, metaDistancia);
    pintarMeta("total", total, metaTotal);

    // Valor recaudado: se muestra como texto (moneda) y como % vs meta de valor si existe
    const valorTotal = data.valorTotal ?? 0;
    const metaValor = data.metas?.valor ?? null;
    document.getElementById("txt-valor").textContent = formatearMoneda(valorTotal);
    const pctValor = metaValor ? Math.round((valorTotal / metaValor) * 100) : 0;
    crearGrafica("valor", Math.min(pctValor, 100));

    // --- Equipos / asesores ---
    renderizarEquipos(data.equipos ?? {});
}

function pintarMeta(id, valor, meta) {
    const pct = meta > 0 ? Math.round((valor / meta) * 100) : 0;
    document.getElementById("txt-" + id).textContent = valor + "/" + meta;
    crearGrafica(id, Math.min(pct, 100));
}

function formatearMoneda(valor) {
    return "$" + Number(valor).toLocaleString("es-CO");
}

/* ============================================================
   GRÁFICAS (dona)
   ============================================================ */

function crearGrafica(id, porcentaje) {
    const canvas = document.getElementById(id);
    if (!canvas) return;

    // Si ya existe una gráfica en este canvas, se destruye antes de recrear
    const existente = Chart.getChart(canvas);
    if (existente) existente.destroy();

    const ctx = canvas.getContext("2d");

    new Chart(ctx, {
        type: "doughnut",
        data: {
            datasets: [{
                data: [porcentaje, 100 - porcentaje],
                backgroundColor: ["#4D7CFE", "#D6E8FF"],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            rotation: 270,
            circumference: 180,
            cutout: "75%",
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });
}

/* ============================================================
   EQUIPOS / ASESORES (panel derecho)
   ============================================================ */

function renderizarEquipos(equipos) {
    const contenedor = document.getElementById("teams-container");
    contenedor.innerHTML = "";

    const nombresEquipos = Object.keys(equipos);

    if (nombresEquipos.length === 0) {
        contenedor.innerHTML =
            '<p style="grid-column:1/3;text-align:center;">No hay equipos configurados en la hoja EQUIPOS.</p>';
        return;
    }

    nombresEquipos.forEach(nombreEquipo => {
        const equipo = equipos[nombreEquipo];
        contenedor.appendChild(crearTarjetaEquipo(nombreEquipo, equipo));
    });
}

function crearTarjetaEquipo(nombreEquipo, equipo) {
    const wrapper = document.createElement("div");
    wrapper.className = "content-teams";

    const titulo = document.createElement("h3");
    titulo.className = "team-title";
    titulo.textContent = "TEAM" + (equipo.lider ? " " + equipo.lider : "");
    wrapper.appendChild(titulo);

    const imagenes = document.createElement("div");
    imagenes.className = "team-images";

    (equipo.asesores ?? []).forEach(asesor => {
        imagenes.appendChild(crearTarjetaAsesor(asesor));
    });

    wrapper.appendChild(imagenes);

    wrapper.appendChild(
        crearBloqueMetas("META LIDER", "META ASESORES", equipo)
    );

    return wrapper;
}

function crearTarjetaAsesor(asesor) {
    const total = (asesor.presencial ?? 0) + (asesor.virtual ?? 0) + (asesor.distancia ?? 0);

    const cont = document.createElement("div");
    cont.className = "content-teams-image";

    const foto = asesor.foto || "img/img1.png";

    cont.innerHTML = `
        <div class="photo">
            <img src="${foto}" alt="${asesor.nombre}" onerror="this.src='img/img1.png'">
            <div class="card-matriculas"><span>${total}</span></div>
        </div>
        <div class="extra-info">
            <div class="info-box"><span>PRESENCIALES</span><p>${asesor.presencial ?? 0}</p></div>
            <div class="info-box"><span>VIRTUALES</span><p>${asesor.virtual ?? 0}</p></div>
            <div class="info-box"><span>A DISTANCIA</span><p>${asesor.distancia ?? 0}</p></div>
        </div>
    `;
    return cont;
}

function crearBloqueMetas(tituloLider, tituloAsesores, equipo) {
    const globales = document.createElement("div");
    globales.className = "content-goals-globals";

    const ml = equipo.metaLider ?? {};
    const ma = equipo.metaAsesores ?? {};

    globales.innerHTML = `
        <div class="container-goals-lider">
            <div class="container-goals-title-lider"><h2 class="goals-title-lider">${tituloLider}</h2></div>
            <div class="container-goals-inperson-lider">
                <h3 class="goals-inperson-lider">Meta Presencial</h3><span>${ml.presencial ?? 0}</span>
            </div>
            <div class="container-goals-virtual">
                <h3 class="goals-virtual-lider">Meta Virtual</h3><span>${ml.virtual ?? 0}</span>
            </div>
            <div class="container-goals-distance">
                <h3 class="goals-distance-lider">Meta A Distancia</h3><span>${ml.distancia ?? 0}</span>
            </div>
        </div>
        <div class="container-goals-asesores">
            <div class="container-goals-title-asesores"><h2 class="goals-title-asesores">${tituloAsesores}</h2></div>
            <div class="container-goals-inperson-asesor">
                <h3 class="goals-inperson-asesor">Meta Presencial</h3><span>${ma.presencial ?? 0}</span>
            </div>
            <div class="container-goals-virtual-asesor">
                <h3 class="goals-virtual-asesor">Meta Virtual</h3><span>${ma.virtual ?? 0}</span>
            </div>
            <div class="container-goals-distance-asesor">
                <h3 class="goals-distance-asesor">Meta A Distancia</h3><span>${ma.distancia ?? 0}</span>
            </div>
        </div>
    `;
    return globales;
}

/* ============================================================
   INICIO
   ============================================================ */

document.addEventListener("DOMContentLoaded", cargarDatos);