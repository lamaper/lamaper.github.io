function createInfoWindow() {
    const infoWindow = document.createElement('div');
    infoWindow.id = 'event-info';
    infoWindow.style.cssText = `
        position: fixed;
        background: rgba(255,255,255,0.96);
        padding: 12px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        max-width: 280px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s, transform 0.2s;
        z-index: 9999;
        font-family: 'Microsoft YaHei', sans-serif;
    `;
    document.body.appendChild(infoWindow);
    return infoWindow;
}

const infoWindow = createInfoWindow();

function showEventInfo(event, marker) {
    const rect = marker.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    
    infoWindow.innerHTML = `
        <div style="border-bottom: 1px solid #eee; margin-bottom:8px; padding-bottom:4px;">
            <strong style="font-size:16px; color:#2c3e50;">${event.title}</strong>
        </div>
        <div style="font-size:13px; color:#666;">
            <div style="margin-bottom:6px;">📌 ${event.posis}</div>
            <div>${event.whereami}</div>
        </div>
    `;

    // 动态计算位置防止溢出
    const windowWidth = window.innerWidth;
    let posLeft = rect.left + rect.width/2;
    if(posLeft > windowWidth - 300) posLeft = windowWidth - 300;
    
    infoWindow.style.left = `${posLeft}px`;
    infoWindow.style.top = `${rect.top + scrollY + 24}px`;
    infoWindow.style.opacity = '1';
}

// 增强版标记初始化
// 修改后的标记初始化函数（保留悬停提示，增加点击跳转）
function initMapMarkers() {
    const mapContainer = document.querySelector('.map-image');
    
    mapContainer.querySelectorAll('.event-marker').forEach(marker => marker.remove());
    
    PaoTaiDetile.forEach(event => {
        const marker = document.createElement('div');
        marker.className = 'event-marker';
        marker.style.cssText = `
            left: ${event.position.x};
            top: ${event.position.y};
            background-color: ${event.color};
            position: absolute;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            cursor: ${event.url ? 'pointer' : 'default'};
            transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        marker.dataset.eventId = event.id;

        // 保留悬停显示信息窗功能
        marker.addEventListener('mouseenter', () => {
            showEventInfo(event, marker);
            marker.style.transform = 'translate(-50%, -50%) scale(2)';
        });

        marker.addEventListener('mouseleave', () => {
            infoWindow.style.opacity = '0';
            marker.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        mapContainer.appendChild(marker);
    });
}

// 自适应优化
const resizeObserver = new ResizeObserver(entries => {
    entries.forEach(entry => {
        const mapWidth = entry.contentRect.width;
        const mapHeight = entry.contentRect.height;
        
        document.querySelectorAll('.event-marker').forEach(marker => {
            const eventId = marker.dataset.eventId;
            const event = PaoTaiDetile.find(e => e.id == eventId);
            
            // 重新计算百分比坐标
            marker.style.left = `${(parseFloat(event.position.x) / 100) * mapWidth}px`;
            marker.style.top = `${(parseFloat(event.position.y) / 100) * mapHeight}px`;
        });
    });
});

// 统一初始化
function initializeApp() {
    const mapContainer = document.querySelector('.map-image');
    resizeObserver.observe(mapContainer);
    initMapMarkers();
}

// 启动应用
document.addEventListener('DOMContentLoaded', initializeApp);
