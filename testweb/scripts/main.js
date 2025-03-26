// 获取元素
const btn = document.getElementById('war-heroes-btn');
const modal = document.getElementById('hero-modal');
const closeBtn = document.querySelector('.close-btn');

// 点击按钮显示模态窗
btn.onclick = () => modal.style.display = "block";

// 点击关闭按钮隐藏模态窗
closeBtn.onclick = () => modal.style.display = "none";

function openModal() {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
}
  
  // 关闭弹窗时
function closeModal() {
    document.body.style.overflow = 'auto';
    document.body.style.position = 'static';
}

// 点击模态窗外部区域关闭
window.onclick = (e) => {
    if (e.target == modal) modal.style.display = "none";
}

// 键盘ESC关闭（新增）
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.style.display === 'block') {
        modal.style.display = 'none';
    }
});

// 卡片点击展开详情（示例）
document.querySelectorAll('.hero-card').forEach(card => {
    card.addEventListener('click', () => {
        // 跳转至人物专题页或展开折叠内容
    });
});

// 新增横向滚动控制（在DOM加载后执行）



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
// 修改后的标记初始化函数（保留悬停提示，增加点击跳转）
function initMapMarkers() {
    const mapContainer = document.querySelector('.map-image');
    
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

        // 新增点击跳转逻辑
        marker.addEventListener('click', () => {
            if(event.url) {
                // 新标签页打开（保留当前页面状态）
                window.open(event.url, '_blank');
                
                // 若需当前页跳转可替换为：
                // window.location.href = event.url;
            }
        });

        mapContainer.appendChild(marker);
    });
}


// 统一初始化
function initializeApp() {
    const mapContainer = document.querySelector('.map-image');
    initMapMarkers();
}

// 启动应用
document.addEventListener('DOMContentLoaded', initializeApp);
