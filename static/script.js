let scoreBreakdownChart;
let riskDistributionChart;

// Initialize charts on load with empty/default data
document.addEventListener("DOMContentLoaded", () => {
    drawGauge(100);
    initCharts();
});

function drawGauge(score) {
    const canvas = document.getElementById("gaugeChart");
    if(!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const x = canvas.width / 2;
    const y = canvas.height - 10;
    const radius = 70;
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;

    // Draw background track
    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.lineWidth = 20;
    ctx.strokeStyle = "#edf2f7";
    ctx.stroke();

    // Draw colored segment based on score
    // Mock gradient: Red -> Orange -> Yellow -> Green
    // Simply splitting into 3 colors for visual closeness to the image
    let endFillAngle = startAngle + (Math.PI * (score / 100));
    
    // We can draw 3 distinct arcs or a gradient. Let's use 3 colored arcs roughly matching the image: 
    // Left: #3182ce (Blue) / Red
    // Center: #ecc94b (Yellow/Orange)
    // Right: #e53e3e (Red)
    // Wait, the image shows Blue, Green, Yellow, Orange, Red in a continuous or segmented arc.
    // Let's draw an arc with a linear gradient.
    const gradient = ctx.createLinearGradient(0, y, canvas.width, y);
    gradient.addColorStop(0, "#3182ce"); // Blue
    gradient.addColorStop(0.3, "#38a169"); // Green
    gradient.addColorStop(0.6, "#ecc94b"); // Yellow
    gradient.addColorStop(0.8, "#ed8936"); // Orange
    gradient.addColorStop(1, "#e53e3e"); // Red

    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endFillAngle);
    ctx.lineWidth = 20;
    ctx.strokeStyle = gradient;
    ctx.stroke();
    
    document.getElementById("score-val").innerText = score;
}

function initCharts() {
    const ctxScore = document.getElementById('scoreBreakdownChart').getContext('2d');
    scoreBreakdownChart = new Chart(ctxScore, {
        type: 'bar',
        data: {
            labels: ['DNS & Hosting', 'HTTPS', 'Ports', 'SSL/TLS', 'Security Headers', 'Server Info', 'WHOIS'],
            datasets: [{
                label: 'Score Breakdown',
                data: [2, 1, 1, 1, 7, 1, 1],
                backgroundColor: [
                    '#4299e1', '#3182ce', '#38a169', '#ed8936', '#ecc94b', '#a0aec0', '#90cdf4'
                ],
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, max: 7, ticks: { stepSize: 1 } },
                x: { grid: { display: false }, ticks: { font: {size: 10}, maxRotation: 45, minRotation: 45 } }
            }
        }
    });

    const ctxRisk = document.getElementById('riskDistributionChart').getContext('2d');
    riskDistributionChart = new Chart(ctxRisk, {
        type: 'doughnut',
        data: {
            labels: ['Low', 'Medium', 'High'],
            datasets: [{
                data: [100, 0, 0],
                backgroundColor: ['#ecc94b', '#ed8936', '#e53e3e'],
                borderWidth: 0,
                cutout: '0%' // Makes it look like a pie chart while keeping doughnut features if needed
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, usePointStyle: false } }
            }
        }
    });
    // Convert to strict pie chart just in case
    riskDistributionChart.config.type = 'pie';
    riskDistributionChart.update();
}

function startScan() {
    const domain = document.getElementById("domain").value;
    const btn = document.getElementById("scan-btn");
    
    if(!domain) return alert("Please enter a domain");

    btn.innerText = "Scanning...";

    // Mock API Call
    setTimeout(() => {
        // Generate a seed based on the domain name to ensure consistent results
        let seed = 0;
        const normalizedDomain = domain.trim().toLowerCase();
        for (let i = 0; i < normalizedDomain.length; i++) {
            seed = ((seed << 5) - seed) + normalizedDomain.charCodeAt(i);
            seed |= 0;
        }
        seed = Math.abs(seed);

        // Simple seeded pseudo-random number generator
        function seededRandom() {
            var t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }

        const issuers = ["Google Trust Services", "Let's Encrypt Authority X3", "Cloudflare Inc ECC CA-3", "DigiCert SHA2 Secure Server CA"];
        const randomIssuer = issuers[Math.floor(seededRandom() * issuers.length)];
        const randomScore = Math.floor(seededRandom() * 20) + 80;

        const data = {
            score: randomScore, 
            risk: randomScore > 85 ? "Secure" : "Fair",
            ports: {
                "80": seededRandom() > 0.1 ? "Open" : "Closed",
                "443": "Open",
                "21": seededRandom() > 0.8 ? "Open" : "Closed",
                "23": seededRandom() > 0.9 ? "Open" : "Closed",
                "3389": seededRandom() > 0.9 ? "Open" : "Closed"
            },
            headers: {
                "Content-Security-Policy": "OK",
                "Referrer-Policy": "OK",
                "Strict-Transport-Security": "OK",
                "X-Content-Type-Options": "OK",
                "X-Frame-Options": "OK"
            },
            ssl: {
                issuer: randomIssuer,
                version: seededRandom() > 0.5 ? "TLSv1.3" : "TLSv1.2",
                expires: "Jun 8 08:36:31 2026 GMT"
            }
        };

        btn.innerText = "Start Scan";

        // Update Gauge
        drawGauge(data.score);
        const isSecure = data.score > 85;
        const color = isSecure ? "#38a169" : "#dd6b20"; // Green for Secure, Orange for Fair
        const labelEl = document.getElementById("score-label");
        if (labelEl) {
            labelEl.innerText = isSecure ? "SECURE" : "FAIR";
            labelEl.style.color = color;
        }

        // Update Risk Badge
        const riskBadge = document.getElementById("risk-badge");
        if (riskBadge) {
            riskBadge.style.backgroundColor = color;
            riskBadge.innerHTML = isSecure ? "▲ SECURE" : "▶ FAIR";
        }

        // Update SSL Details
        const issuerEl = document.getElementById("ssl-issuer");
        const tlsEl = document.getElementById("tls-version");
        const expiryEl = document.getElementById("ssl-expiry");
        if (issuerEl) issuerEl.innerText = data.ssl.issuer;
        if (tlsEl) tlsEl.innerText = data.ssl.version;
        if (expiryEl) expiryEl.innerText = data.ssl.expires;

        // Update Ports Table
        const portsTable = document.getElementById("ports-table");
        if (portsTable) {
            portsTable.innerHTML = "";
            for (const [port, status] of Object.entries(data.ports)) {
                const isClosed = status === "Closed";
                const pillClass = isClosed ? "pill-green" : "pill-orange";
                const risk = isClosed ? "Safe" : (port === "80" || port === "443" ? "Safe" : "Warning");
                
                portsTable.innerHTML += `
                    <tr>
                        <td>${port}</td>
                        <td><span class="pill ${pillClass}">${status}</span></td>
                        <td>${risk}</td>
                    </tr>
                `;
            }
        }

        // Update Chart Data (Randomizing subtly for effect)
        scoreBreakdownChart.data.datasets[0].data = [
            Math.floor(seededRandom() * 3)+1, 
            1, 1, 1, 
            Math.floor(seededRandom() * 3)+5, 
            1, 1
        ];
        scoreBreakdownChart.update();
        
        let lowRisk = Math.floor(seededRandom() * 20) + 80;
        riskDistributionChart.data.datasets[0].data = [lowRisk, 100-lowRisk, 0];
        riskDistributionChart.update();

    }, 1500);
}
