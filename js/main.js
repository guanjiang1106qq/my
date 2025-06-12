document.addEventListener('DOMContentLoaded', () => {
    console.log("Main.js v1.1 loaded and executing."); // Debugging line

    const menuItems = document.querySelectorAll('[data-page]');
    const contentContainer = document.getElementById('app-container');
    let currentChart = null; // To hold the current chart instance

    const destroyExistingCharts = () => {
        // Destroy any existing chart instances to prevent rendering errors
        if (window.salesChart) window.salesChart.destroy();
        if (window.distributionChart) window.distributionChart.destroy();
        if (window.inventoryChart) window.inventoryChart.destroy();
        if (window.userGrowthChart) window.userGrowthChart.destroy();
        if (window.revenueSourceChart) window.revenueSourceChart.destroy();
        if (window.financeChart) window.financeChart.destroy();
        window.salesChart = window.distributionChart = window.inventoryChart = window.userGrowthChart = window.revenueSourceChart = window.financeChart = null;
    };

    const loadPage = async (page) => {
        destroyExistingCharts();

        // Update active state for all navigation items
        menuItems.forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        try {
            const response = await fetch(`pages/${page}.html`);
            if (!response.ok) {
                contentContainer.innerHTML = `<div class="alert alert-danger">Error: Page not found (${page}.html).</div>`;
                return;
            }
            const content = await response.text();
            contentContainer.innerHTML = content;

            // Execute any scripts within the newly loaded content
            const scripts = Array.from(contentContainer.querySelectorAll('script'));
            for (const oldScript of scripts) {
                const newScript = document.createElement('script');
                Array.from(oldScript.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.text = oldScript.text;
                oldScript.parentNode.replaceChild(newScript, oldScript);
            }

            // Initialize charts for the reports page
            if (page === 'reports') {
                // User Growth Chart
                const userGrowthCtx = document.getElementById('user-growth-chart').getContext('2d');
                window.userGrowthChart = new Chart(userGrowthCtx, {
                    type: 'line',
                    data: {
                        labels: ['一月', '二月', '三月', '四月', '五月', '六月'],
                        datasets: [{
                            label: '用户数',
                            data: [500, 600, 750, 800, 950, 1234],
                            borderColor: 'rgba(54, 162, 235, 1)',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            fill: true,
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });

                // Revenue Source Chart
                const revenueSourceCtx = document.getElementById('revenue-source-chart').getContext('2d');
                window.revenueSourceChart = new Chart(revenueSourceCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['订阅', '广告', '服务费'],
                        datasets: [{
                            label: '收入来源',
                            data: [6000, 4000, 2345],
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.8)',
                                'rgba(54, 162, 235, 0.8)',
                                'rgba(255, 206, 86, 0.8)',
                            ],
                        }]
                    },
                    options: {
                        responsive: true
                    }
                });
            }

            // Initialize chart for the finance page
            if (page === 'finance') {
                const financeCtx = document.getElementById('financeChart').getContext('2d');
                window.financeChart = new Chart(financeCtx, {
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
            }

        } catch (error) {
            console.error('Failed to load page:', page, error);
            contentContainer.innerHTML = `<div class="alert alert-danger"><h4>页面加载失败</h4><p>无法加载 <strong>${page}.html</strong>。请检查文件是否存在以及网络连接是否正常。</p><p><small>错误详情: ${error.message}</small></p></div>`;
        }
    };

    // Add click listeners to all navigation items
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            if (page) {
                loadPage(page);
            }
        });
    });

    // Load the initial dashboard page
    loadPage('dashboard');
});
