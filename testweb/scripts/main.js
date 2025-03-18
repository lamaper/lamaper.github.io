// // 合并重复的initMapMarkers函数
// function initMapMarkers() {
//     const mapContainer = document.querySelector('.map-image');
    
//     // 清空旧标记避免重复
//     mapContainer.querySelectorAll('.event-marker').forEach(marker => marker.remove());
    
//     warEvents.forEach(event => {
//         const marker = document.createElement('div');
//         marker.className = 'event-marker';
//         marker.style.left = event.position.x;
//         marker.style.top = event.position.y;
//         marker.dataset.eventId = event.id;
//         marker.title = event.title;
        
//         // 添加颜色区分（需确保data.js中有color字段）
//         if(event.color) {
//             marker.style.backgroundColor = event.color;
//         }

//         marker.addEventListener('click', () => {
//             showEventDetails(event);
//         });

//         mapContainer.appendChild(marker);
//     });
// }

// // 统一初始化入口
// function initializeApp() {
//     initMapMarkers();
//     initTimeline();
// }

// let resizeTimer;
// window.addEventListener('resize', () => {
//   clearTimeout(resizeTimer);
//   resizeTimer = setTimeout(() => {
//     document.querySelectorAll('.event-marker').forEach(marker => {
//       const rect = marker.parentElement.getBoundingClientRect();
//       // 动态重算物理坐标（按需启用）
//       marker.style.left = `${(parseFloat(marker.dataset.x)/rect.width)*100}%`;
//       marker.style.top = `${(parseFloat(marker.dataset.y)/rect.height)*100}%`;
//     });
//   }, 200);  // 防抖延迟
// });

// // 修正加载时机
// document.addEventListener('DOMContentLoaded', initializeApp);

/// main.js
// 创建全局信息窗元素
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

// 信息窗显示逻辑
function showEventInfo(event, marker) {
    const rect = marker.getBoundingClientRect();
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    
    infoWindow.innerHTML = `
        <div style="border-bottom: 1px solid #eee; margin-bottom:8px; padding-bottom:4px;">
            <strong style="font-size:16px; color:#2c3e50;">${event.title}</strong>
        </div>
        <div style="font-size:13px; color:#666;">
            <div style="margin-bottom:6px;">🕒 ${event.time}</div>
            <div>${event.significance}</div>
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
function initMapMarkers() {
    const mapContainer = document.querySelector('.map-image');
    
    // 清空旧标记
    mapContainer.querySelectorAll('.event-marker').forEach(marker => marker.remove());
    
    warEvents.forEach(event => {
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
            cursor: pointer;
            transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        marker.dataset.eventId = event.id;

        // 悬浮事件
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
            const event = warEvents.find(e => e.id == eventId);
            
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