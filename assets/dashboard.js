let globalData = [];
let globalKPIs = {};
let globalAlerts = [];
let globalPopulationData = [];
let fullDataTable;

document.addEventListener("DOMContentLoaded", async () => {
    showLoading();
    
    try {
        const url1 = 'https://docs.google.com/spreadsheets/d/12tWeZXJSyrO9j8SzhduSMqH9hC4aBs46cAK9RNNc14E/gviz/tq?tqx=out:csv&sheet=Sheet1';
        const url2 = 'https://docs.google.com/spreadsheets/d/12tWeZXJSyrO9j8SzhduSMqH9hC4aBs46cAK9RNNc14E/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('الورقه 2');

        const parseCSV = (url) => {
            return new Promise((resolve, reject) => {
                Papa.parse(url, {
                    download: true,
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => resolve(results.data),
                    error: (error) => reject(error)
                });
            });
        };

        const [raw1, raw2] = await Promise.all([
            parseCSV(url1),
            parseCSV(url2)
        ]);

        if(!raw1 || raw1.length === 0) throw new Error("لم يتم العثور على بيانات");

        // Clean and map data 1
        globalData = raw1.map(d => {
            return {
                ...d,
                'إجمالي مستفيدين': parseFloat(d['اجمالي مستفيدين'] || d['إجمالي مستفيدين']) || 0,
                'إجمالي تحصيل': parseFloat(d['اجمالي التحصيل'] || d['إجمالي تحصيل']) || 0,
                'مؤمن عليه': parseFloat(d['مؤمن عليه']) || 0,
                'غير مؤمن عليه': parseFloat(d['غير مؤمن عليه']) || 0,
                'موظف حكومي': parseFloat(d['موظف حكومي']) || 0,
                'بالمعاش': parseFloat(d['بالمعاش']) || 0,
                'تكافل وكرامة': parseFloat(d['تكافل وكرامه'] || d['تكافل وكرامة']) || 0,
                'تحديث': parseFloat(d['تحديث']) || 0,
                'جديد': parseFloat(d['جديد']) || 0,
                'ملف اسري': parseFloat(d['ملف اسري']) || 0,
                'الشهر': (d['الشهر'] || '').trim().replace('ابريل', 'أبريل')
            };
        }).filter(d => d['الشهر'] && d['المنفذ']);

        // Clean and map pop data
        globalPopulationData = raw2.map(d => {
            return {
                ...d,
                'عدد المسجلين': parseFloat(d['عدد المسجلين']) || 0,
                'عدد الغير مسجلين': parseFloat(d['عدد الغير مسجلين'] || d['عدد غير المسجلين']) || 0,
                'نسبة التغطية': parseFloat(d['نسبة التغطية']) || 0
            };
        }).filter(d => d['المنفذ'] || d['إسم الوحدة / المركز']);

        // Generate Alerts (mock logic or based on rules)
        globalAlerts = [];
        const centers = [...new Set(globalData.map(d => d['المنفذ']))];
        const activeMonths = [...new Set(globalData.map(d => d['الشهر']))];
        
        // Simple KPIs based on totals
        globalKPIs = { summary: null, top_centers: [] };
        let centerKPIs = {};
        
        globalData.forEach(d => {
            const center = d['المنفذ'];
            if(!centerKPIs[center]) {
                centerKPIs[center] = { 'المنفذ': center, kpi_score: 0, 'إجمالي مستفيدين': 0, 'إجمالي تحصيل': 0 };
            }
            centerKPIs[center]['إجمالي مستفيدين'] += d['إجمالي مستفيدين'];
            centerKPIs[center]['إجمالي تحصيل'] += d['إجمالي تحصيل'];
            centerKPIs[center].kpi_score += (d['إجمالي مستفيدين'] * 0.4 + d['إجمالي تحصيل'] * 0.6);
        });
        
        // Normalize KPI score to 0-100 roughly
        const maxScore = Math.max(...Object.values(centerKPIs).map(c => c.kpi_score));
        globalKPIs.top_centers = Object.values(centerKPIs).map(c => {
            c.kpi_score = maxScore ? Math.round((c.kpi_score / maxScore) * 100) : 0;
            return c;
        }).sort((a,b) => b.kpi_score - a.kpi_score).slice(0, 10);

        // Setup Filters
        setupFilters();

        // Initial Render
        updateDashboard(globalData);
        showAlerts(globalAlerts);

        hideLoading();
    } catch (error) {
        console.error("Error loading data:", error);
        showAlerts([{ type: 'anomaly', message: 'خطأ في تحميل البيانات من جوجل شيت. تأكد من أن الرابط متاح للعامة.' }]);
        hideLoading();
    }
});

function showLoading() {
    document.getElementById('loading-overlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-overlay').style.display = 'none';
}

function setupFilters() {
    const monthFilter = document.getElementById('month-filter');
    const regionFilter = document.getElementById('region-filter');
    const centerFilter = document.getElementById('center-filter');

    // Populate months and regions if not hardcoded
    // Order months chronologically
    const orderedMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const months = [...new Set(globalData.map(d => d['الشهر']))].sort((a, b) => {
        const iA = orderedMonths.indexOf(a);
        const iB = orderedMonths.indexOf(b);
        return (iA === -1 ? 99 : iA) - (iB === -1 ? 99 : iB);
    });
    
    const regions = [...new Set(globalData.map(d => d['المنطقة']))];

    // Helper to clear and populate
    const populate = (select, options) => {
        select.innerHTML = '<option value="all">الكل</option>';
        options.forEach(opt => {
            select.innerHTML += `<option value="${opt}">${opt}</option>`;
        });
    };

    populate(monthFilter, months);
    populate(regionFilter, regions);

    const applyFilters = () => {
        let filteredData = [...globalData];
        const m = monthFilter.value;
        const r = regionFilter.value;
        const c = centerFilter.value;

        if (m !== 'all') filteredData = filteredData.filter(d => d['الشهر'] === m);
        
        if (r !== 'all') {
            filteredData = filteredData.filter(d => d['المنطقة'] === r);
            // Update center filter
            const centers = [...new Set(globalData.filter(d => d['المنطقة'] === r).map(d => d['المنفذ']))];
            centerFilter.disabled = false;
            let centerOptions = '<option value="all">كل المنافذ</option>';
            centers.forEach(c => centerOptions += `<option value="${c}">${c}</option>`);
            
            // Retain selected center if valid
            const currentC = centerFilter.value;
            centerFilter.innerHTML = centerOptions;
            if(centers.includes(currentC)) centerFilter.value = currentC;
        } else {
            centerFilter.disabled = true;
            centerFilter.innerHTML = '<option value="all">كل المنافذ</option>';
        }

        let filteredPopData = [...globalPopulationData];

        if (r !== 'all') {
            filteredPopData = filteredPopData.filter(d => d['المنطقة'] === r);
        }
        if (c !== 'all' && !centerFilter.disabled) {
            filteredPopData = filteredPopData.filter(d => d['إسم الوحدة / المركز'] === c);
        }

        if (centerFilter.value !== 'all' && !centerFilter.disabled) {
            filteredData = filteredData.filter(d => d['المنفذ'] === centerFilter.value);
        }

        updateDashboard(filteredData, filteredPopData);
    };

    monthFilter.addEventListener('change', applyFilters);
    regionFilter.addEventListener('change', applyFilters);
    centerFilter.addEventListener('change', applyFilters);
}

function updateDashboard(data, popData = globalPopulationData) {
    if(!data || data.length === 0) return;

    updateKPIs(data);
    
    // Main Charts
    renderLineChart(data, 'chart-line-beneficiaries');
    renderBarChart(data, 'chart-bar-collections');

    // Top Centers
    renderTopBeneficiariesChart(data, 'chart-bar-top-beneficiaries');
    renderTopCollectionsChart(data, 'chart-bar-top-collections');

    // Other Charts
    renderGaugeChart(data, 'chart-gauge-health');
    renderDonutChart(data, 'chart-donut-categories');
    renderHeatmap(data, 'chart-heatmap-performance');

    if (popData && popData.length > 0) {
        renderStackedCoverageChart(popData, 'chart-stacked-coverage');
        renderTopCoverageChart(popData, 'chart-bar-top-coverage');
    }

    // Tables
    renderAlertsTable();
    renderTopCentersTable();
    renderFullDataTable(data);
}

function formatNumber(num) {
    return new Intl.NumberFormat('ar-EG').format(num);
}

function updateKPIs(data) {
    // If not filtered, use global KPIs summary
    let summary;
    
    const isFiltered = data.length !== globalData.length;

    if (!isFiltered && globalKPIs.summary) {
        summary = globalKPIs.summary;
    } else {
        // Calculate manually for filtered data
        summary = {
            beneficiaries: { value: data.reduce((s, d) => s + (parseFloat(d['إجمالي مستفيدين']) || 0), 0), growth: 0 },
            collections: { value: data.reduce((s, d) => s + (parseFloat(d['إجمالي تحصيل']) || 0), 0), growth: 0 },
            updates: { value: data.reduce((s, d) => s + (parseFloat(d['تحديث']) || 0), 0), growth: 0 },
            new_members: { value: data.reduce((s, d) => s + (parseFloat(d['جديد']) || 0), 0), growth: 0 },
            family_files: { value: data.reduce((s, d) => s + (parseFloat(d['ملف اسري']) || 0), 0), growth: 0 }
        };
    }

    const setKpi = (id, obj, isCurrency = false) => {
        document.getElementById(`kpi-${id}`).innerText = formatNumber(obj.value) + (isCurrency ? ' ج.م' : '');
        const gEle = document.getElementById(`growth-${id}`);
        const valEle = gEle.querySelector('.val');
        const arrow = gEle.querySelector('.arrow');
        
        valEle.innerText = Math.abs(obj.growth) + '%';
        gEle.className = 'kpi-growth ' + (obj.growth > 0 ? 'growth-up' : (obj.growth < 0 ? 'growth-down' : 'growth-neutral'));
        arrow.innerText = obj.growth > 0 ? '↑' : (obj.growth < 0 ? '↓' : '−');
    };

    setKpi('beneficiaries', summary.beneficiaries);
    setKpi('collections', summary.collections, true);
    setKpi('updates', summary.updates);
    setKpi('new', summary.new_members);
    setKpi('files', summary.family_files);
}

function showAlerts(alerts) {
    const container = document.getElementById('alerts-container');
    container.innerHTML = '';
    alerts.forEach((alert, index) => {
        if(alert.type === 'anomaly' || alert.type === 'warning') {
            const div = document.createElement('div');
            div.className = `alert ${alert.type === 'anomaly' ? '' : 'warning'}`;
            div.innerHTML = `
                <div><i class="fa-solid fa-bell"></i> ${alert.message}</div>
                <div class="alert-close" onclick="this.parentElement.remove()">&times;</div>
            `;
            container.appendChild(div);
            
            // Auto remove after 10s
            setTimeout(() => div.remove(), 10000);
        }
    });
}

function renderAlertsTable() {
    const anomalies = globalAlerts.filter(a => a.type === 'anomaly');
    
    new Tabulator("#table-alerts", {
        data: anomalies,
        layout: "fitColumns",
        columns: [
            {title: "المنفذ", field: "center"},
            {title: "الشهر", field: "month"},
            {title: "المؤشر", field: "metric"},
            {title: "نسبة الانخفاض", field: "drop", formatter: "color", formatterParams: {color: "#e74c3c"}},
        ],
        placeholder: "لا يوجد منافذ منخفضة الأداء",
        textDirection: "rtl"
    });
}

function renderTopCentersTable() {
    const topData = globalKPIs.top_centers || [];
    
    new Tabulator("#table-top-centers", {
        data: topData,
        layout: "fitColumns",
        columns: [
            {title: "المنفذ", field: "المنفذ"},
            {title: "مؤشر KPI", field: "kpi_score", formatter: "progress", formatterParams:{color:"#27ae60"}},
            {title: "المستفيدين", field: "إجمالي مستفيدين", bottomCalc: "sum"},
            {title: "التحصيل", field: "إجمالي تحصيل", bottomCalc: "sum", formatter: "money", formatterParams:{symbol: "ج.م", thousand: ",", precision: false}},
        ],
        textDirection: "rtl"
    });
}

function renderFullDataTable(data) {
    if (fullDataTable) {
        fullDataTable.setData(data);
        return;
    }

    fullDataTable = new Tabulator("#table-full-data", {
        data: data,
        layout: "fitDataStretch",
        pagination: "local",
        paginationSize: 10,
        textDirection: "rtl",
        columns: [
            {title: "الشهر", field: "الشهر", headerFilter: "input"},
            {title: "المنطقة", field: "المنطقة", headerFilter: "input"},
            {title: "المنفذ", field: "المنفذ", headerFilter: "input"},
            {title: "إجمالي مستفيدين", field: "إجمالي مستفيدين", sorter:"number"},
            {title: "إجمالي تحصيل", field: "إجمالي تحصيل", sorter:"number", formatter:"money", formatterParams:{symbol: "ج.م", thousand: ",", precision: false}},
            {title: "مؤمن عليه", field: "مؤمن عليه", sorter:"number"},
            {title: "تكافل وكرامة", field: "تكافل وكرامة", sorter:"number"},
            {title: "تحديث", field: "تحديث", sorter:"number"}
        ]
    });
}
