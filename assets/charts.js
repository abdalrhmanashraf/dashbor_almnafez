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
    const orderedMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const activeMonths = [...new Set(data.map(d => d['الشهر']))].sort((a, b) => {
        const iA = orderedMonths.indexOf(a);
        const iB = orderedMonths.indexOf(b);
        return (iA === -1 ? 99 : iA) - (iB === -1 ? 99 : iB);
    });

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
    const orderedMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const activeMonths = [...new Set(data.map(d => d['الشهر']))].sort((a, b) => {
        const iA = orderedMonths.indexOf(a);
        const iB = orderedMonths.indexOf(b);
        return (iA === -1 ? 99 : iA) - (iB === -1 ? 99 : iB);
    });

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

function renderTopBeneficiariesChart(data, elementId) {
    const latestMonth = data.reduce((latest, current) => {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        return months.indexOf(current['الشهر']) > months.indexOf(latest) ? current['الشهر'] : latest;
    }, 'يناير');

    const latestData = data.filter(d => d['الشهر'] === latestMonth);
    const sortedData = [...latestData].sort((a, b) => (parseFloat(b['إجمالي مستفيدين']) || 0) - (parseFloat(a['إجمالي مستفيدين']) || 0));
    const topData = sortedData.slice(0, 10);

    const trace = {
        y: topData.map(d => d['المنفذ']).reverse(),
        x: topData.map(d => parseFloat(d['إجمالي مستفيدين']) || 0).reverse(),
        type: 'bar',
        orientation: 'h',
        marker: { color: colors.blue }
    };

    const layout = {
        ...darkLayout,
        margin: { t: 20, r: 20, l: 150, b: 40 },
        yaxis: { ...darkLayout.yaxis, automargin: true }
    };

    Plotly.newPlot(elementId, [trace], layout, {responsive: true, displayModeBar: false});
}

function renderTopCollectionsChart(data, elementId) {
    const latestMonth = data.reduce((latest, current) => {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        return months.indexOf(current['الشهر']) > months.indexOf(latest) ? current['الشهر'] : latest;
    }, 'يناير');

    const latestData = data.filter(d => d['الشهر'] === latestMonth);
    const sortedData = [...latestData].sort((a, b) => (parseFloat(b['إجمالي تحصيل']) || 0) - (parseFloat(a['إجمالي تحصيل']) || 0));
    const topData = sortedData.slice(0, 5);

    const trace = {
        y: topData.map(d => d['المنفذ']).reverse(),
        x: topData.map(d => parseFloat(d['إجمالي تحصيل']) || 0).reverse(),
        type: 'bar',
        orientation: 'h',
        marker: { color: colors.green }
    };

    const layout = {
        ...darkLayout,
        margin: { t: 20, r: 20, l: 150, b: 40 },
        yaxis: { ...darkLayout.yaxis, automargin: true }
    };

    Plotly.newPlot(elementId, [trace], layout, {responsive: true, displayModeBar: false});
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
    const orderedMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const activeMonths = [...new Set(data.map(d => d['الشهر']))].sort((a, b) => {
        const iA = orderedMonths.indexOf(a);
        const iB = orderedMonths.indexOf(b);
        return (iA === -1 ? 99 : iA) - (iB === -1 ? 99 : iB);
    });
    
    // Sort centers by total beneficiaries to pick top 20
    const centersMap = {};
    data.forEach(d => {
        if(!centersMap[d['المنفذ']]) centersMap[d['المنفذ']] = 0;
        centersMap[d['المنفذ']] += (parseFloat(d['إجمالي مستفيدين']) || 0);
    });
    const sortedCenters = Object.keys(centersMap).sort((a, b) => centersMap[b] - centersMap[a]);
    const topCenters = sortedCenters.slice(0, 20).reverse(); // top 20, reversed for y-axis

    const zValues = topCenters.map(center => {
        return activeMonths.map(month => {
            const d = data.find(item => item['المنفذ'] === center && item['الشهر'] === month);
            return d ? (parseFloat(d['إجمالي مستفيدين']) || 0) : 0; 
        });
    });

    const trace = {
        z: zValues,
        x: activeMonths,
        y: topCenters,
        type: 'heatmap',
        colorscale: 'Blues'
    };

    const layout = {
        ...darkLayout,
        margin: { t: 20, r: 20, l: 150, b: 40 },
        yaxis: { ...darkLayout.yaxis, automargin: true }
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
    const topData = sortedData.slice(0, 20); // Get top 20
    
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
        xaxis: { ...darkLayout.xaxis, title: 'نسبة التغطية (%)', range: [0, 100] },
        yaxis: { ...darkLayout.yaxis, automargin: true }
    };

    Plotly.newPlot(elementId, [trace], layout, {responsive: true, displayModeBar: false});
}
