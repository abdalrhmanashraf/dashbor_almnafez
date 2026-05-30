// Default Plotly layout settings for dark mode
const darkLayout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
        family: 'Cairo, sans-serif',
        color: '#e2e8f0'
    },
    margin: { t: 40, r: 20, l: 40, b: 40 },
    xaxis: { gridcolor: '#334155', zerolinecolor: '#334155' },
    yaxis: { gridcolor: '#334155', zerolinecolor: '#334155' },
    legend: { orientation: 'h', y: -0.2 }
};

const colors = {
    blue: '#4A90D9',
    green: '#27AE60',
    orange: '#F39C12',
    red: '#E74C3C',
    purple: '#9b59b6',
    gray: '#95a5a6'
};

function renderLineChart(data, elementId) {
    // Group by Region and Month
    const regions = [...new Set(data.map(d => d['المنطقة']))];
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    // Sort months logically based on the data
    const activeMonths = [...new Set(data.map(d => d['الشهر']))].sort((a, b) => months.indexOf(a) - months.indexOf(b));

    const traces = regions.map((region, i) => {
        const regionData = data.filter(d => d['المنطقة'] === region);
        const yValues = activeMonths.map(m => {
            const monthData = regionData.filter(d => d['الشهر'] === m);
            return monthData.reduce((sum, d) => sum + (parseFloat(d['إجمالي مستفيدين']) || 0), 0);
        });

        return {
            x: activeMonths,
            y: yValues,
            type: 'scatter',
            mode: 'lines+markers',
            name: region,
            line: { shape: 'spline', width: 3 },
            marker: { size: 8 }
        };
    });

    const layout = {
        ...darkLayout,
        title: '',
        hovermode: 'x unified'
    };

    Plotly.newPlot(elementId, traces, layout, {responsive: true, displayModeBar: false});
}

function renderBarChart(data, elementId) {
    const regions = [...new Set(data.map(d => d['المنطقة']))];
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const activeMonths = [...new Set(data.map(d => d['الشهر']))].sort((a, b) => months.indexOf(a) - months.indexOf(b));

    const traces = regions.map((region, i) => {
        const regionData = data.filter(d => d['المنطقة'] === region);
        const yValues = activeMonths.map(m => {
            const monthData = regionData.filter(d => d['الشهر'] === m);
            return monthData.reduce((sum, d) => sum + (parseFloat(d['إجمالي تحصيل']) || 0), 0);
        });

        return {
            x: activeMonths,
            y: yValues,
            type: 'bar',
            name: region
        };
    });

    const layout = {
        ...darkLayout,
        barmode: 'group',
        hovermode: 'x unified'
    };

    Plotly.newPlot(elementId, traces, layout, {responsive: true, displayModeBar: false});
}

function renderBubbleChart(data, elementId) {
    const centers = [...new Set(data.map(d => d['المنفذ']))];
    
    const latestMonth = data.reduce((latest, current) => {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        return months.indexOf(current['الشهر']) > months.indexOf(latest) ? current['الشهر'] : latest;
    }, 'يناير');

    const latestData = data.filter(d => d['الشهر'] === latestMonth);

    const trace = {
        x: latestData.map(d => parseFloat(d['إجمالي مستفيدين']) || 0),
        y: latestData.map(d => parseFloat(d['إجمالي تحصيل']) || 0),
        text: latestData.map(d => d['المنفذ']),
        mode: 'markers',
        marker: {
            size: latestData.map(d => (parseFloat(d['تحديث']) || 0) / 10), // Scale down size
            sizemode: 'area',
            color: latestData.map((d, i) => i),
            colorscale: 'Viridis',
            showscale: false
        }
    };

    const layout = {
        ...darkLayout,
        xaxis: { ...darkLayout.xaxis, title: 'إجمالي المستفيدين' },
        yaxis: { ...darkLayout.yaxis, title: 'إجمالي التحصيل' },
        hovermode: 'closest'
    };

    Plotly.newPlot(elementId, [trace], layout, {responsive: true, displayModeBar: false});
}

function renderTreemap(data, elementId) {
    // Only use the latest month for the treemap
    const latestMonth = data.reduce((latest, current) => {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        return months.indexOf(current['الشهر']) > months.indexOf(latest) ? current['الشهر'] : latest;
    }, 'يناير');

    const latestData = data.filter(d => d['الشهر'] === latestMonth);

    const labels = [];
    const parents = [];
    const values = [];

    labels.push('المجموع');
    parents.push('');
    values.push(latestData.reduce((sum, d) => sum + (parseFloat(d['إجمالي مستفيدين']) || 0), 0));

    const regions = [...new Set(latestData.map(d => d['المنطقة']))];
    regions.forEach(region => {
        labels.push(region);
        parents.push('المجموع');
        const regionSum = latestData.filter(d => d['المنطقة'] === region).reduce((sum, d) => sum + (parseFloat(d['إجمالي مستفيدين']) || 0), 0);
        values.push(regionSum);
        
        latestData.filter(d => d['المنطقة'] === region).forEach(d => {
            labels.push(d['المنفذ']);
            parents.push(region);
            values.push(parseFloat(d['إجمالي مستفيدين']) || 0);
        });
    });

    const trace = {
        type: 'treemap',
        labels: labels,
        parents: parents,
        values: values,
        textinfo: 'label+value+percent parent',
        marker: { colorscale: 'Blues' }
    };

    const layout = {
        ...darkLayout,
        margin: { t: 0, r: 0, l: 0, b: 0 }
    };

    Plotly.newPlot(elementId, [trace], layout, {responsive: true});
}

function renderGaugeChart(data, elementId) {
    const latestMonth = data.reduce((latest, current) => {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        return months.indexOf(current['الشهر']) > months.indexOf(latest) ? current['الشهر'] : latest;
    }, 'يناير');

    const latestData = data.filter(d => d['الشهر'] === latestMonth);
    
    const totalBeneficiaries = latestData.reduce((sum, d) => sum + (parseFloat(d['إجمالي مستفيدين']) || 0), 0);
    const totalInsured = latestData.reduce((sum, d) => sum + (parseFloat(d['مؤمن عليه']) || 0), 0);
    
    const percentage = totalBeneficiaries > 0 ? (totalInsured / totalBeneficiaries) * 100 : 0;

    const trace = {
        type: "indicator",
        mode: "gauge+number",
        value: percentage,
        title: { text: "نسبة التغطية التأمينية", font: { size: 14 } },
        number: { suffix: "%", font: { size: 24 } },
        gauge: {
            axis: { range: [null, 100], tickwidth: 1, tickcolor: "darkblue" },
            bar: { color: colors.blue },
            bgcolor: "rgba(0,0,0,0)",
            borderwidth: 2,
            bordercolor: "transparent",
            steps: [
                { range: [0, 50], color: "rgba(231, 76, 60, 0.3)" },
                { range: [50, 80], color: "rgba(243, 156, 18, 0.3)" },
                { range: [80, 100], color: "rgba(39, 174, 96, 0.3)" }
            ]
        }
    };

    const layout = { ...darkLayout, margin: { t: 40, r: 20, l: 20, b: 20 } };

    Plotly.newPlot(elementId, [trace], layout, {responsive: true});
}

function renderDonutChart(data, elementId) {
    const latestMonth = data.reduce((latest, current) => {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        return months.indexOf(current['الشهر']) > months.indexOf(latest) ? current['الشهر'] : latest;
    }, 'يناير');

    const latestData = data.filter(d => d['الشهر'] === latestMonth);

    const categories = ['مؤمن عليه', 'غير مؤمن عليه', 'موظف حكومي', 'بالمعاش', 'تكافل وكرامة'];
    const values = categories.map(cat => 
        latestData.reduce((sum, d) => sum + (parseFloat(d[cat]) || 0), 0)
    );

    const trace = {
        values: values,
        labels: categories,
        type: 'pie',
        hole: .6,
        marker: {
            colors: [colors.green, colors.red, colors.blue, colors.orange, colors.purple]
        },
        textinfo: 'percent',
        hoverinfo: 'label+value'
    };

    const layout = { ...darkLayout, margin: { t: 20, r: 20, l: 20, b: 20 } };

    Plotly.newPlot(elementId, [trace], layout, {responsive: true});
}

function renderHeatmap(data, elementId) {
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const activeMonths = [...new Set(data.map(d => d['الشهر']))].sort((a, b) => months.indexOf(a) - months.indexOf(b));
    const centers = [...new Set(data.map(d => d['المنفذ']))];

    const zValues = centers.map(center => {
        return activeMonths.map(month => {
            const d = data.find(item => item['المنفذ'] === center && item['الشهر'] === month);
            // Example metric: performance can be based on beneficiaries
            return d ? (parseFloat(d['إجمالي مستفيدين']) || 0) : 0; 
        });
    });

    const trace = {
        z: zValues,
        x: activeMonths,
        y: centers,
        type: 'heatmap',
        colorscale: 'Blues'
    };

    const layout = {
        ...darkLayout,
        margin: { t: 20, r: 20, l: 150, b: 40 }
    };

    Plotly.newPlot(elementId, [trace], layout, {responsive: true});
}

function renderStackedCoverageChart(popData, elementId) {
    const regions = [...new Set(popData.map(d => d['المنطقة']))];
    
    const registered = regions.map(region => {
        return popData.filter(d => d['المنطقة'] === region).reduce((sum, d) => sum + (parseFloat(d['عدد المسجلين']) || 0), 0);
    });
    
    const unregistered = regions.map(region => {
        return popData.filter(d => d['المنطقة'] === region).reduce((sum, d) => sum + (parseFloat(d['عدد الغير مسجلين']) || 0), 0);
    });

    const trace1 = {
        x: regions,
        y: registered,
        name: 'مسجلين',
        type: 'bar',
        marker: { color: colors.green }
    };

    const trace2 = {
        x: regions,
        y: unregistered,
        name: 'غير مسجلين',
        type: 'bar',
        marker: { color: colors.red }
    };

    const layout = {
        ...darkLayout,
        barmode: 'stack',
        hovermode: 'x unified'
    };

    Plotly.newPlot(elementId, [trace1, trace2], layout, {responsive: true, displayModeBar: false});
}

function renderTopCoverageChart(popData, elementId) {
    const sortedData = [...popData].sort((a, b) => b['نسبة التغطية'] - a['نسبة التغطية']);
    const topData = sortedData.slice(0, 15);
    
    const trace = {
        y: topData.map(d => d['إسم الوحدة / المركز']).reverse(),
        x: topData.map(d => d['نسبة التغطية']).reverse(),
        type: 'bar',
        orientation: 'h',
        marker: {
            color: topData.map(d => d['نسبة التغطية']).reverse(),
            colorscale: 'Blues'
        },
        text: topData.map(d => d['نسبة التغطية'] + '%').reverse(),
        textposition: 'auto',
    };

    const layout = {
        ...darkLayout,
        margin: { t: 20, r: 20, l: 150, b: 40 },
        xaxis: { ...darkLayout.xaxis, title: 'نسبة التغطية (%)', range: [0, 100] }
    };

    Plotly.newPlot(elementId, [trace], layout, {responsive: true, displayModeBar: false});
}
