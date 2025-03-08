function initSidebar(sidebarId, width, content) {
    const parentDoc = window.parent.document;
    let isClosing = false;
    
    function createStyles() {
        if (!parentDoc.getElementById('dynamic-sidebar-styles')) {
            const style = parentDoc.createElement('style');
            style.id = 'dynamic-sidebar-styles';
            style.textContent = `
                :root {
                    --sidebar-width: ${width};
                }
            `;
            parentDoc.head.appendChild(style);
            
            // Add CSS
            const link = parentDoc.createElement('link');
            link.id = 'sidebar-css';
            link.rel = 'stylesheet';
            link.href = '${CSS_PATH}';
            parentDoc.head.appendChild(link);
        }
    }

    function adjustSidebarHeight() {
        const sidebar = parentDoc.getElementById(sidebarId);
        if (sidebar) {
            sidebar.style.height = window.parent.innerHeight + "px";
        }
    }
    
    function createSidebar() {
        isClosing = false;
        
        const existingSidebar = parentDoc.getElementById(sidebarId);
        if (existingSidebar) {
            existingSidebar.remove();
        }

        const sidebar = parentDoc.createElement('div');
        sidebar.id = sidebarId;
        sidebar.className = 'sidebar';
        sidebar.innerHTML = `
            <span class="close-btn">&#xD7;</span>
            ${content}
        `;

        parentDoc.body.appendChild(sidebar);
        
        sidebar.offsetHeight;
        
        requestAnimationFrame(() => {
            sidebar.classList.add('visible');
        });

        const closeBtn = sidebar.querySelector('.close-btn');
        closeBtn.addEventListener('click', closeSidebar);
        
        adjustSidebarHeight();
    }

    function closeSidebar() {
        if (isClosing) return;
        
        const sidebar = parentDoc.getElementById(sidebarId);
        
        if (sidebar) {
            isClosing = true;
            sidebar.classList.remove('visible');
            
            sidebar.addEventListener('transitionend', () => {
                sidebar.remove();
                isClosing = false;
            }, { once: true });
        }
    }

    createStyles();
    createSidebar();
    
    window.parent.addEventListener('resize', adjustSidebarHeight);
} 