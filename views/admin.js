fetch('/chartdata')
    .then(response => response.json())
    .then(data => {
        console.log("Data received:", data);
        var xValues = data.map(expense => expense.category);
        var yValues = data.map(expense => expense.amount);
        var barColors = ["red", "green", "blue", "orange", "brown", "purple", "pink", "yellow", "grey", "cyan"];

        yValues = yValues.map(value => parseFloat(value).toFixed(2));

        var chart = new Chart("expenseChart", {
            type: "bar",
            data: {
                labels: xValues,
                datasets: [{
                    backgroundColor: barColors,
                    data: yValues
                }]
            },
            options: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: "Expense Breakdown by Category"
                }
            }
        });
    })
    .catch(error => {
        console.error("Error fetching chart data:", error);
    });

fetch('/chartdata')
    .then(response => response.json())
    .then(data => {
        console.log("Data received:", data);
        var categories = data.map(expense => expense.category);
        var amounts = data.map(expense => expense.amount);
        var barColors = ["yellow", "cyan", "violet", "orange", "brown", "purple", "pink", "grey", "green", "blue"];

        var piechart = new Chart("categoryChart", {
            type: "pie",
            data: {
                labels: categories,
                datasets: [{
                    backgroundColor: barColors,
                    data: amounts
                }]
            },
            options: {
                title: {
                    display: true,
                    text: "Expenses by Category"
                },
                legend: {
                    display: true,
                    position: "top",
                    labels: {
                        generateLabels: function(chart) {
                            var data = chart.data || {};
                            var labels = data.labels || [];
                            var datasets = data.datasets || [];

                            return labels.map(function(label, i) {
                                var dataset = datasets[0] || {};
                                var value = dataset.data && dataset.data[i];
                                return {
                                    text: label + ' - ' + ' (' + (value || 0) + ')',
                                    fillStyle: dataset.backgroundColor && dataset.backgroundColor[i],
                                    hidden: isNaN(value) || (dataset.hidden && dataset.hidden[i]),
                                    index: i
                                };
                            });
                        }
                    }
                }
            }
        });
    })
    .catch(error => {
        console.error("Error fetching chart data:", error);
    });