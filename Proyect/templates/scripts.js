
function crearGrafica(id, porcentaje) {

    const ctx = document.getElementById(id).getContext("2d");

    new Chart(ctx, {
        type: "doughnut",
        data: {
            datasets: [{
                data: [porcentaje, 100 - porcentaje],
                backgroundColor: [
                    "#4D7CFE",
                    "#D6E8FF"
                ],
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
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            }
        }
    });

}
crearGrafica("presencial", 67);
crearGrafica("virtual", 33);
crearGrafica("distancia", 48);
crearGrafica("total", 72);
crearGrafica("valor", 91);
