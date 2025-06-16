// Main application initialization
function initializeApp() {
    console.log("Initializing application...");
    
    const contentContainer = document.getElementById('app-container');
    if (!contentContainer) {
        console.error('Error: Could not find app-container element');
        return;
    }
    
    const menuItems = document.querySelectorAll('[data-page]');
    console.log(`Found ${menuItems.length} menu items`);
    
    let currentChart = null; // To hold the current chart instance
    
    // Initialize menu event listeners
    function initializeMenu() {
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) {
                    console.log(`Menu item clicked: ${page}`);
                    loadPage(page);
                }
            });
        });
    }
    
    // Load page function with enhanced error handling
    async function loadPage(page) {
        console.log(`Loading page: ${page}`);
        if (!page) {
            console.error('No page specified to load');
            return;
        }
        
        // Show loading state
        contentContainer.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="height: 300px;">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">加载中...</span>
                </div>
            </div>`;
        
        // Destroy any existing charts
        destroyExistingCharts();
        
        // Update active state for menu items
        menuItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });
        
        try {
            const response = await fetch(`pages/${page}.html`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const content = await response.text();
            contentContainer.innerHTML = content;
            console.log(`Successfully loaded page: ${page}`);
            
            // Small delay to ensure DOM is fully rendered
            setTimeout(() => {
                // Execute any scripts in the loaded content
                const scripts = contentContainer.getElementsByTagName('script');
                for (let script of scripts) {
                    const newScript = document.createElement('script');
                    if (script.src) {
                        newScript.src = script.src;
                    } else {
                        newScript.text = script.textContent;
                    }
                    document.body.appendChild(newScript);
                }
                
                // Initialize any charts if needed
                initializePageSpecificContent(page);
                
                // Re-initialize any Bootstrap components
                initializeBootstrapComponents();
                
                // Force a resize event to ensure charts render correctly
                window.dispatchEvent(new Event('resize'));
                
                console.log(`Page ${page} initialization complete`);
            }, 100);
            
        } catch (error) {
            console.error('Error loading page:', error);
            contentContainer.innerHTML = `
                <div class="alert alert-danger m-3">
                    <h4>页面加载失败</h4>
                    <p>无法加载 ${page}.html</p>
                    <p><small>错误: ${error.message}</small></p>
                    <button class="btn btn-sm btn-outline-secondary mt-2" onclick="window.location.reload()">
                        重新加载
                    </button>
                </div>`;
        }
    }

    // Destroy any existing chart instances
    function destroyExistingCharts() {
        console.log('Destroying existing charts...');
        
        // 显式销毁财务相关图表
        if (window.financeChart) {
            try {
                window.financeChart.destroy();
                window.financeChart = null;
                console.log('Finance chart destroyed');
            } catch (e) {
                console.error('Error destroying finance chart:', e);
            }
        }
        
        if (window.channelChart) {
            try {
                window.channelChart.destroy();
                window.channelChart = null;
                console.log('Channel chart destroyed');
            } catch (e) {
                console.error('Error destroying channel chart:', e);
            }
        }
        
        // 销毁其他所有Chart.js实例
        if (window.Chart) {
            try {
                Chart.helpers.each(Chart.instances, function(instance) {
                    try {
                        instance.destroy();
                    } catch (e) {
                        console.error('Error destroying chart instance:', e);
                    }
                });
            } catch (e) {
                console.error('Error in Chart.helpers.each:', e);
            }
        }
        
        // 清理其他可能存在的图表引用
        const chartRefs = [
            'salesChart', 'distributionChart', 'inventoryChart',
            'userGrowthChart', 'revenueSourceChart',
            'platformSalesChart', 'inventoryTurnoverChart', 'warehouseValueChart',
            'inventoryAgeChart', 'highAgeSkuChart', 'obsoleteStockTrendChart',
            'returnReasonChart', 'returnRateTrendChart'
        ];
        
        chartRefs.forEach(chartName => {
            if (window[chartName]) {
                try {
                    if (window[chartName] && typeof window[chartName].destroy === 'function') {
                        window[chartName].destroy();
                    }
                    window[chartName] = null;
                } catch (e) {
                    console.error(`Error destroying ${chartName}:`, e);
                }
            }
        });
    }
    
    // Initialize Bootstrap components
    function initializeBootstrapComponents() {
        // Initialize tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.forEach(function(tooltipTriggerEl) {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });
        
        // Initialize popovers
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.forEach(function(popoverTriggerEl) {
            new bootstrap.Popover(popoverTriggerEl);
        });
    }
    
    // Initialize page-specific content like charts
    function initializePageSpecificContent(page) {
        console.log(`Initializing content for page: ${page}`);
        
        // Ensure Chart.js is loaded
        if (typeof Chart === 'undefined') {
            console.error('Chart.js is not loaded');
            setTimeout(() => initializePageSpecificContent(page), 100);
            return;
        }
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            try {
                // Initialize charts based on the current page
                if (page === 'dashboard') {
                    console.log('Initializing dashboard charts...');
                    initializeDashboardCharts();
                } else if (page === 'finance') {
                    console.log('Initializing finance charts...');
                    // 确保DOM完全加载
                    setTimeout(() => {
                        initializeFinanceCharts();
                        // 监听标签页切换事件
                        document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(btn => {
                            btn.addEventListener('shown.bs.tab', function () {
                                setTimeout(initializeFinanceCharts, 100);
                            });
                        });
                    }, 100);
                } else if (page === 'reports') {
                    console.log('Initializing report charts...');
                    initializeReportCharts();
                } else if (page === 'inventory') {
                    console.log('Initializing inventory charts...');
                    initializeInventoryCharts();
                } else if (page === 'logistics') {
                    console.log('Initializing logistics charts...');
                    // 初始化物流管理页面的图表
                    if (typeof initAllCharts === 'function') {
                        // 确保DOM完全加载
                        setTimeout(initAllCharts, 100);
                        // 监听标签页切换事件
                        document.querySelectorAll('button[data-bs-toggle="tab"]').forEach(btn => {
                            btn.addEventListener('shown.bs.tab', function () {
                                setTimeout(initAllCharts, 100);
                            });
                        });
                    }
                }
                
                // Re-initialize tooltips after content is loaded
                initializeTooltips();
                
                console.log(`Charts initialized for ${page} page`);
                
                // Force chart update
                window.dispatchEvent(new Event('resize'));
            } catch (error) {
                console.error(`Error initializing ${page} page:`, error);
            }
        }, 100);
    }
    
    // Chart initialization functions
    function initializeDashboardCharts() {
        console.log('Initializing dashboard charts...');
        
        // 销售趋势图
        const salesCtx = document.getElementById('salesChart');
        if (salesCtx) {
            new Chart(salesCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
                    datasets: [{
                        label: '销售额',
                        data: [12000, 19000, 13000, 15000, 22000, 23000],
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: getDefaultChartOptions({
                    yTitle: '销售额 (元)',
                    yMin: 0,
                    yMax: 25000,
                    yStep: 5000
                })
            });
        }
        
        // 平台销售分布图
        const platformCtx = document.getElementById('platformSalesChart');
        if (platformCtx) {
            new Chart(platformCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['淘宝', '拼多多', '抖音', '快手'],
                    datasets: [{
                        label: '销售额',
                        data: [15000, 20000, 10000, 5000],
                        backgroundColor: ['#ff9500', '#d90000', '#000000', '#ff0000'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
        }
        
        // 库存图表
        const inventoryCtx = document.getElementById('inventoryChart');
        if (inventoryCtx) {
            new Chart(inventoryCtx.getContext('2d'), {
                type: 'bar',
                data: {
                    labels: ['连衣裙', '手机壳', 'T恤', '裤子'],
                    datasets: [{
                        label: '库存量 (件)',
                        data: [500, 300, 800, 600],
                        backgroundColor: '#ff9500',
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                        x: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }
    
    // 初始化财务管理页面图表
    function initializeFinanceCharts() {
        console.log('Starting finance charts initialization...');
        
        // 确保标签页内容已激活
        const overviewTab = document.getElementById('overview-tab');
        if (overviewTab) {
            const tab = new bootstrap.Tab(overviewTab);
            tab.show();
        }
        
        // 确保DOM元素存在
        if (!document.getElementById('financeChart') || !document.getElementById('channelChart')) {
            console.warn('Chart containers not found, retrying...');
            setTimeout(initializeFinanceCharts, 100);
            return;
        }
        
        // 财务趋势图
        const financeCtx = document.getElementById('financeChart');
        if (financeCtx) {
            new Chart(financeCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
                    datasets: [
                        {
                            label: '销售额',
                            data: [120000, 190000, 130000, 150000, 220000, 230000],
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: true,
                            tension: 0.4,
                            yAxisID: 'y',
                            borderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            label: '毛利润',
                            data: [48000, 76000, 52000, 60000, 88000, 92000],
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            fill: true,
                            tension: 0.4,
                            yAxisID: 'y',
                            borderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        },
                        {
                            label: '净利润',
                            data: [30000, 60000, 40000, 45000, 70000, 75000],
                            borderColor: 'rgba(153, 102, 255, 1)',
                            backgroundColor: 'rgba(153, 102, 255, 0.2)',
                            fill: true,
                            tension: 0.4,
                            yAxisID: 'y',
                            borderWidth: 2,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }
                    ]
                },
                options: getDefaultChartOptions({
                    yTitle: '金额 (元)',
                    yMin: 0,
                    yMax: 250000,
                    yStep: 50000,
                    maintainAspectRatio: false,
                    responsive: true
                })
            });
        }
        
        // 销售渠道占比图
        const channelCtx = document.getElementById('channelChart');
        if (channelCtx) {
            const data = {
                labels: ['淘宝', '京东', '拼多多', '抖音', '其他'],
                datasets: [{
                    data: [35, 25, 20, 15, 5],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)'
                    ],
                    borderWidth: 1,
                    hoverOffset: 10
                }]
            };
            
            // 确保画布元素存在且有宽度
            if (channelCtx.offsetWidth === 0) {
                console.warn('Channel chart container has zero width, showing tab and retrying...');
                // 确保标签页内容可见
                const tab = new bootstrap.Tab(document.getElementById('overview-tab'));
                tab.show();
                setTimeout(initializeFinanceCharts, 200);
                return;
            }
            
            // 确保之前的图表实例被销毁
            if (window.financeChannelChart) {
                try {
                    window.financeChannelChart.destroy();
                } catch (e) {
                    console.error('Error destroying existing chart:', e);
                }
            }
            
            // 创建新的图表实例
            window.financeChannelChart = new Chart(channelCtx.getContext('2d'), {
                type: 'doughnut',
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                padding: 15,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                font: {
                                    size: 12
                                }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: ${value}% (${percentage}%)`;
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: '销售渠道占比',
                            font: {
                                size: 14,
                                weight: 'bold'
                            },
                            padding: {
                                top: 10,
                                bottom: 10
                            }
                        }
                    },
                    animation: {
                        animateScale: true,
                        animateRotate: true
                    }
                }
            });
        }
    }
    
    // 初始化库存管理页面所有图表
    function initializeInventoryCharts() {
        console.log('Initializing inventory charts...');
        
        // 1. 库存周转率趋势图
        initializeTurnoverChart();
        
        // 2. 仓库价值分布图
        initializeWarehouseValueChart();
        
        // 3. 库龄分析图
        initializeInventoryAgeChart();
        
        // 4. 高库龄SKU图
        initializeHighAgeSkuChart();
        
        // 5. 呆滞库存趋势图
        initializeObsoleteStockChart();
        
        // 6. 退货原因分析图
        initializeReturnReasonChart();
        
        // 7. 退货率趋势图
        initializeReturnRateChart();
        
        // 初始化工具提示
        initializeTooltips();
    }

    // 初始化工具提示
    function initializeTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.forEach(function(tooltipTriggerEl) {
            new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // 库存周转率趋势图
    function initializeTurnoverChart() {
        const ctx = document.getElementById('inventoryTurnoverChart');
        if (!ctx) return;
        
        new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
                datasets: [{
                    label: '库存周转率',
                    data: [2.5, 2.8, 2.6, 3.1, 2.9, 3.5],
                    tension: 0.3,
                    fill: true,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'white',
                    pointBorderWidth: 2,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: 'rgba(54, 162, 235, 1)',
                    pointHoverBorderWidth: 2
                }]
            },
            options: getDefaultChartOptions({
                yTitle: '周转率',
                yMin: 2,
                yMax: 4,
                yStep: 0.5
            })
        });
    }
    
    // 仓库价值分布图
    function initializeWarehouseValueChart() {
        const ctx = document.getElementById('warehouseValueChart');
        if (!ctx) return;
        
        new Chart(ctx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['华东仓', '华南仓', '华北仓', '西部仓', '海外仓'],
                datasets: [{
                    data: [3500000, 2800000, 1200000, 950000, 300120],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.7)',
                        'rgba(75, 192, 192, 0.7)',
                        'rgba(255, 206, 86, 0.7)',
                        'rgba(255, 159, 64, 0.7)',
                        'rgba(153, 102, 255, 0.7)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ¥${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // 库龄分析图
    function initializeInventoryAgeChart() {
        const ctx = document.getElementById('inventoryAgeChart');
        if (!ctx) return;
        
        new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['0-30天', '31-60天', '61-90天', '91-180天', '180+天'],
                datasets: [{
                    label: '库存价值 (元)',
                    data: [4500000, 2500000, 1500000, 800000, 450000],
                    backgroundColor: ['#28a745', '#17a2b8', '#ffc107', '#fd7e14', '#dc3545']
                }]
            },
            options: getDefaultChartOptions({
                yTitle: '库存价值 (元)',
                yMin: 0,
                yMax: 5000000,
                yStep: 1000000,
                yCallback: (value) => (value / 10000).toFixed(0) + '万'
            })
        });
    }
    
    // 高库龄SKU图
    function initializeHighAgeSkuChart() {
        const ctx = document.getElementById('highAgeSkuChart');
        if (!ctx) return;
        
        new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['SKU102', 'SKU088', 'SKU321', 'SKU543', 'SKU019'],
                datasets: [{
                    label: '积压价值',
                    data: [45000, 2500, 2200, 1800, 1500],
                    backgroundColor: '#fd7e14'
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `积压价值: ¥${context.raw.toLocaleString()}`
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => '¥' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    }
    
    // 呆滞库存趋势图
    function initializeObsoleteStockChart() {
        const ctx = document.getElementById('obsoleteStockTrendChart');
        if (!ctx) return;
        
        new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
                datasets: [{
                    label: '呆滞库存价值',
                    data: [12000, 12500, 11000, 13000, 15000, 14000],
                    tension: 0.3,
                    fill: true,
                    backgroundColor: 'rgba(108, 117, 125, 0.2)',
                    borderColor: 'rgba(108, 117, 125, 1)',
                    borderWidth: 2
                }]
            },
            options: getDefaultChartOptions({
                yTitle: '库存价值 (元)',
                yMin: 10000,
                yMax: 16000,
                yStep: 2000
            })
        });
    }
    
    // 退货原因分析图
    function initializeReturnReasonChart() {
        const ctx = document.getElementById('returnReasonChart');
        if (!ctx) return;
        
        new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['质量问题', '尺码不合', '七天无理由', '发错货', '其他'],
                datasets: [{
                    data: [35, 25, 20, 15, 5],
                    backgroundColor: [
                        'rgba(220, 53, 69, 0.7)',
                        'rgba(255, 193, 7, 0.7)',
                        'rgba(40, 167, 69, 0.7)',
                        'rgba(23, 162, 184, 0.7)',
                        'rgba(108, 117, 125, 0.7)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.label}: ${context.raw}%`
                        }
                    }
                }
            }
        });
    }
    
    // 退货率趋势图
    function initializeReturnRateChart() {
        const ctx = document.getElementById('returnRateTrendChart');
        if (!ctx) return;
        
        new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
                datasets: [{
                    label: '退货率 (%)',
                    data: [3.2, 2.8, 3.5, 3.1, 2.9, 3.8],
                    tension: 0.3,
                    fill: true,
                    backgroundColor: 'rgba(220, 53, 69, 0.2)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 2
                }]
            },
            options: getDefaultChartOptions({
                yTitle: '退货率 (%)',
                yMin: 2.5,
                yMax: 4,
                yStep: 0.5
            })
        });
    }
    
    // 获取默认图表选项
    function getDefaultChartOptions({ yTitle = '', yMin = null, yMax = null, yStep = null, yCallback = null }) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 10
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 14 },
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (yCallback) {
                                    label += yCallback(context.parsed.y);
                                } else {
                                    label += context.parsed.y;
                                }
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: yMin === 0,
                    min: yMin,
                    max: yMax,
                    ticks: {
                        stepSize: yStep,
                        callback: yCallback
                    },
                    title: {
                        display: !!yTitle,
                        text: yTitle,
                        font: { weight: 'bold' }
                    },
                    grid: { color: 'rgba(0, 0, 0, 0.05)' }
                },
                x: { grid: { display: false } }
            },
            elements: {
                line: { tension: 0.3 },
                point: {
                    radius: 4,
                    hoverRadius: 6,
                    hoverBorderWidth: 2
                }
            }
        };
    }
    
    function initializeFinanceCharts() {
        console.log('Initializing finance charts...');
        
        // 1. 初始化财务趋势图
        const financeCtx = document.getElementById('financeChart');
        if (financeCtx) {
            try {
                // 确保画布元素可见
                if (financeCtx.offsetParent === null) {
                    console.log('Finance chart canvas is not visible, will retry after tab switch');
                    return;
                }
                
                // 销毁现有图表实例
                if (window.financeChart) {
                    try {
                        window.financeChart.destroy();
                    } catch (e) {
                        console.error('Error destroying existing finance chart:', e);
                    }
                }
                
                // 确保画布元素没有被其他图表使用
                const financeCanvas = financeCtx.getContext('2d');
                if (!financeCanvas) {
                    console.error('Failed to get 2D context for finance chart');
                    return;
                }
                
                window.financeChart = new Chart(financeCanvas, {
                    type: 'line',
                    data: {
                        labels: ['一月', '二月', '三月', '四月', '五月', '六月'],
                        datasets: [{
                            label: '销售额',
                            data: [150000, 180000, 220000, 250000, 280000, 310000],
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            fill: true,
                            yAxisID: 'y',
                        }, {
                            label: '利润',
                            data: [45000, 55000, 65000, 70000, 80000, 95000],
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: true,
                            yAxisID: 'y',
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                type: 'linear',
                                display: true,
                                position: 'left',
                            }
                        }
                    }
                });
                console.log('Finance chart initialized successfully');
            } catch (error) {
                console.error('Error initializing finance chart:', error);
            }
        } else {
            console.warn('Finance chart canvas not found');
        }
        
        // 2. 初始化销售渠道占比图
        const channelCtx = document.getElementById('channelChart');
        if (channelCtx) {
            try {
                // 确保画布元素可见
                if (channelCtx.offsetParent === null) {
                    console.log('Channel chart canvas is not visible, will retry after tab switch');
                    return;
                }
                
                // 销毁现有图表实例
                if (window.channelChart) {
                    try {
                        window.channelChart.destroy();
                    } catch (e) {
                        console.error('Error destroying existing channel chart:', e);
                    }
                }
                
                // 确保画布元素没有被其他图表使用
                const channelCanvas = channelCtx.getContext('2d');
                if (!channelCanvas) {
                    console.error('Failed to get 2D context for channel chart');
                    return;
                }
                
                window.channelChart = new Chart(channelCanvas, {
                    type: 'doughnut',
                    data: {
                        labels: ['天猫', '京东', '拼多多', '自营网站', '其他'],
                        datasets: [{
                            data: [35, 25, 20, 15, 5],
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.7)',
                                'rgba(54, 162, 235, 0.7)',
                                'rgba(255, 206, 86, 0.7)',
                                'rgba(75, 192, 192, 0.7)',
                                'rgba(153, 102, 255, 0.7)'
                            ],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.label || '';
                                        const value = context.raw || 0;
                                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                        const percentage = Math.round((value / total) * 100);
                                        return `${label}: ${value} (${percentage}%)`;
                                    }
                                }
                            }
                        },
                        cutout: '65%'
                    }
                });
                console.log('Channel chart initialized successfully');
            } catch (error) {
                console.error('Error initializing channel chart:', error);
            }
        } else {
            console.warn('Channel chart canvas not found');
        }
    }
    
    function initializeReportCharts() {
        console.log('Initializing report charts...');
        // Add your report chart initialization code here
    }

    // Initialize the application
    initializeMenu();
    
    // Load the initial page
    const initialPage = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
    loadPage(initialPage);
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', () => {
        const page = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
        loadPage(page);
    });
}

// Start the application when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
