// Shared color palette and layout configuration
const colors = {
    blue: '#3b82f6',
    cyan: '#06b6d4',
    green: '#10b981',
    red: '#ef4444',
    orange: '#f59e0b',
    purple: '#8b5cf6',
    yellow: '#eab308',
    background: 'rgba(10, 14, 26, 0)',
    grid: 'rgba(255, 255, 255, 0.06)',
    text: '#94a3b8',
    textMain: '#f1f5f9'
};

const darkLayout = {
    paper_bgcolor: colors.background,
    plot_bgcolor: colors.background,
    font: { family: 'Tajawal, sans-serif', color: colors.textMain },
    margin: { t: 40, r: 20, l: 40, b: 40 },
    xaxis: { gridcolor: colors.grid, zerolinecolor: colors.grid, tickfont: { color: colors.text } },
    yaxis: { gridcolor: colors.grid, zerolinecolor: colors.grid, tickfont: { color: colors.text } },
    legend: { orientation: 'h', y: -0.2, font: { color: colors.text } }
};

// Define month order for sorting
const orderedMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function getActiveMonths(data) {
    return [...new Set(data.map(d => d['الشهر']))].sort((a, b) => {
        const iA = orderedMonths.indexOf(a);
        const iB = orderedMonths.indexOf(b);
        return (iA === -1 ? 99 : iA) - (iB === -1 ? 99 : iB);
    });
}

// 1. Line Chart: Beneficiaries over time
function renderLineChart(data, elementId) {
    const activeMonths = getActiveMonths(data);
    const regions = [...new Set(data.map(d => d['المنطقة']))];

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

    const layout = { ...darkLayout, hovermode: 'x unified' };
    Plotly.newPlot(elementId, traces, layout, {responsive: true, displayModeBar: false});
}

// 2. Bar Chart: Collections by region per month
function renderBarChart(data, elementId) {
    const activeMonths = getActiveMonths(data);
    const regions = [...new Set(data.map(d => d['المنطقة']))];

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

    const layout = { ...darkLayout, barmode: 'group', hovermode: 'x unified' };
    Plotly.newPlot(elementId, traces, layout, {responsive: true, displayModeBar: false});
}

// 3. Top 10 Beneficiaries
function renderTopBeneficiariesChart(data, elementId) {
    const centerSums = {};
    data.forEach(d => {
        const center = d['المنفذ'];
        if (!centerSums[center]) centerSums[center] = 0;
        centerSums[center] += parseFloat(d['إجمالي مستفيدين']) || 0;
    });

    const sortedCenters = Object.keys(centerSums).map(c => ({
        center: c,
        total: centerSums[c]
    })).sort((a, b) => b.total - a.total);
    
    const topData = sortedCenters.slice(0, 10);

    const trace = {
        y: topData.map(d => d.center).reverse(),
        x: topData.map(d => d.total).reverse(),
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

// 4. Top 5 Collections
function renderTopCollectionsChart(data, elementId) {
    const centerSums = {};
    data.forEach(d => {
        const center = d['المنفذ'];
        if (!centerSums[center]) centerSums[center] = 0;
        centerSums[center] += parseFloat(d['إجمالي تحصيل']) || 0;
    });

    const sortedCenters = Object.keys(centerSums).map(c => ({
        center: c,
        total: centerSums[c]
    })).sort((a, b) => b.total - a.total);
    
    const topData = sortedCenters.slice(0, 5);

    const trace = {
        y: topData.map(d => d.center).reverse(),
        x: topData.map(d => d.total).reverse(),
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

// 5. Donut Chart: Top Regions in New Files
function renderNewFilesDonutChart(data, elementId) {
    const regionSums = {};
    let totalNew = 0;
    data.forEach(d => {
        const region = d['المنطقة'];
        const val = parseFloat(d['جديد']) || 0;
        if (!regionSums[region]) regionSums[region] = 0;
        regionSums[region] += val;
        totalNew += val;
    });

    const labels = Object.keys(regionSums);
    const values = Object.values(regionSums);

    const trace = {
        labels: labels,
        values: values,
        type: 'pie',
        hole: 0.6,
        textinfo: 'percent',
        hoverinfo: 'label+value+percent',
        marker: {
            colors: [colors.blue, colors.cyan, colors.purple, colors.orange, colors.red, colors.green]
        }
    };

    const layout = {
        ...darkLayout,
        margin: { t: 20, b: 20, l: 20, r: 20 },
        showlegend: true,
        legend: { orientation: 'v', x: 1, y: 0.5 }
    };

    Plotly.newPlot(elementId, [trace], layout, {responsive: true, displayModeBar: false});
}

// 6. Cumulative Area Chart: Payments
function renderCumulativePaymentChart(data, elementId) {
    const activeMonths = getActiveMonths(data);
    
    let cumulative = 0;
    const yValues = activeMonths.map(m => {
        const monthData = data.filter(d => d['الشهر'] === m);
        const sum = monthData.reduce((acc, d) => acc + (parseFloat(d['اجمالي السداد']) || 0), 0);
        cumulative += sum;
        return cumulative;
    });

    const trace = {
        x: activeMonths,
        y: yValues,
        fill: 'tozeroy',
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: colors.cyan, width: 3 },
        fillcolor: 'rgba(6, 182, 212, 0.2)'
    };

    const layout = { ...darkLayout, hovermode: 'x unified' };
    Plotly.newPlot(elementId, [trace], layout, {responsive: true, displayModeBar: false});
}

// 7. Donut Chart: Categories
function renderDonutChart(data, elementId) {
    const categories = {
        'مؤمن عليه': data.reduce((sum, d) => sum + (parseFloat(d['مؤمن عليه']) || 0), 0),
        'غير مؤمن عليه': data.reduce((sum, d) => sum + (parseFloat(d['غير مؤمن عليه']) || 0), 0),
        'موظف حكومي': data.reduce((sum, d) => sum + (parseFloat(d['موظف حكومي']) || 0), 0),
        'بالمعاش': data.reduce((sum, d) => sum + (parseFloat(d['بالمعاش']) || 0), 0),
        'تكافل وكرامة': data.reduce((sum, d) => sum + (parseFloat(d['تكافل وكرامة']) || 0), 0)
    };

    const trace = {
        values: Object.values(categories),
        labels: Object.keys(categories),
        type: 'pie',
        hole: 0.6,
        marker: { colors: [colors.blue, colors.red, colors.green, colors.orange, colors.cyan] },
        textinfo: 'percent',
        hoverinfo: 'label+value'
    };

    const layout = { ...darkLayout, margin: { t: 20, b: 20, l: 20, r: 20 } };
    Plotly.newPlot(elementId, [trace], layout, {responsive: true, displayModeBar: false});
}

// 8. Stacked Bar: Coverage (Registered vs Unregistered)
function renderStackedCoverageChart(popData, elementId) {
    const regions = [...new Set(popData.map(d => d['المنطقة']))];
    
    const registered = regions.map(r => {
        return popData.filter(d => d['المنطقة'] === r).reduce((sum, d) => sum + (parseFloat(d['عدد المسجلين']) || 0), 0);
    });
    
    const unregistered = regions.map(r => {
        return popData.filter(d => d['المنطقة'] === r).reduce((sum, d) => sum + (parseFloat(d['عدد الغير مسجلين']) || 0), 0);
    });

    const trace1 = { x: regions, y: registered, name: 'مسجلين', type: 'bar', marker: { color: colors.blue } };
    const trace2 = { x: regions, y: unregistered, name: 'غير مسجلين', type: 'bar', marker: { color: colors.red } };

    const layout = { ...darkLayout, barmode: 'stack', hovermode: 'x unified' };
    Plotly.newPlot(elementId, [trace1, trace2], layout, {responsive: true, displayModeBar: false});
}

// 9. Gauge Chart: Health
function renderGaugeChart(data, elementId) {
    const totalInsured = data.reduce((sum, d) => sum + (parseFloat(d['مؤمن عليه']) || 0), 0);
    const totalUninsured = data.reduce((sum, d) => sum + (parseFloat(d['غير مؤمن عليه']) || 0), 0);
    const total = totalInsured + totalUninsured;
    const ratio = total > 0 ? (totalInsured / total) * 100 : 0;

    const trace = {
        type: "indicator",
        mode: "gauge+number",
        value: ratio,
        number: { suffix: "%", font: { color: colors.textMain } },
        gauge: {
            axis: { range: [null, 100], tickwidth: 1, tickcolor: colors.text },
            bar: { color: colors.green },
            bgcolor: "rgba(255,255,255,0.1)",
            borderwidth: 0,
            steps: [
                { range: [0, 50], color: "rgba(239, 68, 68, 0.3)" },
                { range: [50, 80], color: "rgba(245, 158, 11, 0.3)" },
                { range: [80, 100], color: "rgba(16, 185, 129, 0.3)" }
            ]
        }
    };

    const layout = { ...darkLayout, margin: { t: 40, r: 40, l: 40, b: 40 } };
    Plotly.newPlot(elementId, [trace], layout, {responsive: true, displayModeBar: false});
}

// 10. Heatmap: Performance
function renderHeatmap(data, elementId) {
    const activeMonths = getActiveMonths(data);
    const centerSums = {};
    data.forEach(d => {
        const center = d['المنفذ'];
        if (!centerSums[center]) centerSums[center] = 0;
        centerSums[center] += parseFloat(d['إجمالي مستفيدين']) || 0;
    });

    const topCenters = Object.keys(centerSums).sort((a,b) => centerSums[b] - centerSums[a]).slice(0, 20);
    
    const zValues = topCenters.map(center => {
        return activeMonths.map(month => {
            const match = data.find(d => d['المنفذ'] === center && d['الشهر'] === month);
            return match ? (parseFloat(match['إجمالي مستفيدين']) || 0) : 0;
        });
    });

    const trace = {
        z: zValues,
        x: activeMonths,
        y: topCenters,
        type: 'heatmap',
        colorscale: 'Blues',
        showscale: false
    };

    const layout = { ...darkLayout, margin: { t: 20, r: 20, l: 180, b: 40 } };
    Plotly.newPlot(elementId, [trace], layout, {responsive: true, displayModeBar: false});
}

// ABSENCE CHARTS

function renderTopAbsenceChart(absenceData, elementId) {
    const centerSums = {};
    absenceData.forEach(d => {
        // Find center column. From inspection it's 'اسم المنفذ'
        const center = d['اسم المنفذ'] || d['المنفذ'] || d['Center'] || 'غير معروف';
        // Assume 'عدد الأيام' or similar is the days count, if not just count rows
        const days = parseFloat(d['عدد الأيام'] || d['Days'] || 1) || 1; 
        if (!centerSums[center]) centerSums[center] = 0;
        centerSums[center] += days;
    });

    const sortedCenters = Object.keys(centerSums).map(c => ({
        center: c,
        total: centerSums[c]
    })).sort((a, b) => b.total - a.total).slice(0, 10);

    const trace = {
        y: sortedCenters.map(d => d.center).reverse(),
        x: sortedCenters.map(d => d.total).reverse(),
        type: 'bar',
        orientation: 'h',
        marker: { color: colors.purple }
    };

    const layout = { ...darkLayout, margin: { t: 20, r: 20, l: 150, b: 40 } };
    Plotly.newPlot(elementId, [trace], layout, {responsive: true, displayModeBar: false});
}

function renderAbsenceTypesChart(absenceData, elementId) {
    const typeSums = {};
    absenceData.forEach(d => {
        const type = d['نوع الغياب'] || d['Type'] || d['النوع'] || 'غير مسجل';
        const days = parseFloat(d['عدد الأيام'] || d['Days'] || 1) || 1;
        if (!typeSums[type]) typeSums[type] = 0;
        typeSums[type] += days;
    });

    const trace = {
        labels: Object.keys(typeSums),
        values: Object.values(typeSums),
        type: 'pie',
        hole: 0.5,
        marker: { colors: [colors.purple, colors.orange, colors.cyan, colors.red, colors.green] }
    };

    const layout = { ...darkLayout, margin: { t: 20, b: 20, l: 20, r: 20 } };
    Plotly.newPlot(elementId, [trace], layout, {responsive: true, displayModeBar: false});
}

function renderAbsenceByCenterChart(absenceData, elementId) {
    const regionSums = {};
    absenceData.forEach(d => {
        const region = d['المركز / المنطقة'] || d['📋 قاعدة بيانات المنافذ الطبية — الهيئة العامة للتأمين الصحي — فرع الأقصر المركز / المنطقة'] || 'غير معروف';
        const days = parseFloat(d['عدد الأيام'] || d['Days'] || 1) || 1;
        if (!regionSums[region]) regionSums[region] = 0;
        regionSums[region] += days;
    });

    const sortedRegions = Object.keys(regionSums).map(r => ({
        region: r,
        total: regionSums[r]
    })).sort((a,b) => b.total - a.total);

    const trace = {
        x: sortedRegions.map(d => d.region),
        y: sortedRegions.map(d => d.total),
        type: 'bar',
        marker: { color: colors.cyan }
    };

    const layout = { ...darkLayout, hovermode: 'x unified' };
    Plotly.newPlot(elementId, [trace], layout, {responsive: true, displayModeBar: false});
}
