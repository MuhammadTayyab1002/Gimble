  // ============================================
    // 1. IMAGE VIEWER (Zoom with Scroll Wheel)
    // ============================================
    const imageEl = document.getElementById('mainImage');
    let currentZoom = 1;
    const zoomStep = 0.1;
    const maxZoom = 5;
    const minZoom = 0.5;
    
    function updateZoom() {
        imageEl.style.transform = `scale(${currentZoom})`;
        const zoomPercentSpan = document.getElementById('zoomPercent');
        if (zoomPercentSpan) zoomPercentSpan.innerText = `${Math.round(currentZoom * 100)}%`;
    }
    
    const zoomInBtn = document.getElementById('zoomInBtn');
    const zoomOutBtn = document.getElementById('zoomOutBtn');
    const resetZoomBtn = document.getElementById('resetZoomBtn');
    
    if (zoomInBtn) zoomInBtn.onclick = () => { if (currentZoom + zoomStep <= maxZoom) { currentZoom += zoomStep; updateZoom(); } };
    if (zoomOutBtn) zoomOutBtn.onclick = () => { if (currentZoom - zoomStep >= minZoom) { currentZoom -= zoomStep; updateZoom(); } };
    if (resetZoomBtn) resetZoomBtn.onclick = () => { currentZoom = 1; updateZoom(); };
    
    if (imageEl) {
        imageEl.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0 && currentZoom + zoomStep <= maxZoom) currentZoom += zoomStep;
            else if (e.deltaY > 0 && currentZoom - zoomStep >= minZoom) currentZoom -= zoomStep;
            updateZoom();
        });
    }

    // ============================================
    // 2. PDF VIEWER (Preloaded from assets/MT_Gimble.pdf)
    // ============================================
    let pdfDoc = null;
    let currentPage = 1;
    let totalPages = 0;
    let currentScale = 1.5;
    const canvasPdf = document.getElementById('pdfCanvas');
    const ctx = canvasPdf ? canvasPdf.getContext('2d') : null;
    
    if (canvasPdf && ctx && typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        
        const pdfPath = 'assets/MT_Gimble.pdf';
        
        async function loadPdfFromPath(path) {
            try {
                const loadingTask = pdfjsLib.getDocument(path);
                pdfDoc = await loadingTask.promise;
                totalPages = pdfDoc.numPages;
                currentPage = 1;
                const pageNumDisplay = document.getElementById('pageNumDisplay');
                if (pageNumDisplay) pageNumDisplay.innerText = `Page ${currentPage} / ${totalPages}`;
                renderPage(currentPage, currentScale);
            } catch (error) {
                console.warn("PDF not found at", path, error);
                const pageNumDisplay = document.getElementById('pageNumDisplay');
                if (pageNumDisplay) pageNumDisplay.innerText = `Error: PDF not found`;
                if (ctx) {
                    ctx.fillStyle = "#1e2a3a";
                    ctx.fillRect(0, 0, canvasPdf.width || 400, canvasPdf.height || 300);
                    ctx.fillStyle = "#ffaa88";
                    ctx.font = "16px sans-serif";
                    ctx.fillText("⚠️ PDF file not found at 'assets/MT_Gimble.pdf'", 30, 100);
                    ctx.fillText("Please place your PDF file in the assets folder.", 30, 140);
                }
            }
        }
        
        async function renderPage(pageNum, scale) {
            if (!pdfDoc) return;
            try {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: scale });
                canvasPdf.height = viewport.height;
                canvasPdf.width = viewport.width;
                const renderContext = { canvasContext: ctx, viewport: viewport };
                await page.render(renderContext).promise;
            } catch(e) { console.error(e); }
        }
        
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        const zoomPdfIn = document.getElementById('zoomPdfIn');
        const zoomPdfOut = document.getElementById('zoomPdfOut');
        
        if (prevBtn) prevBtn.onclick = () => { if (pdfDoc && currentPage > 1) { currentPage--; const pageDisplay = document.getElementById('pageNumDisplay'); if (pageDisplay) pageDisplay.innerText = `Page ${currentPage} / ${totalPages}`; renderPage(currentPage, currentScale); } };
        if (nextBtn) nextBtn.onclick = () => { if (pdfDoc && currentPage < totalPages) { currentPage++; const pageDisplay = document.getElementById('pageNumDisplay'); if (pageDisplay) pageDisplay.innerText = `Page ${currentPage} / ${totalPages}`; renderPage(currentPage, currentScale); } };
        if (zoomPdfIn) zoomPdfIn.onclick = () => { if (pdfDoc) { currentScale += 0.25; if(currentScale>3.5) currentScale=3.5; renderPage(currentPage, currentScale); } };
        if (zoomPdfOut) zoomPdfOut.onclick = () => { if (pdfDoc) { currentScale -= 0.25; if(currentScale<0.6) currentScale=0.6; renderPage(currentPage, currentScale); } };
        
        // Load PDF from assets
        loadPdfFromPath(pdfPath);
    } else {
        console.error("PDF.js not loaded or canvas missing");
    }

    // ============================================
    // 3. STL VIEWER (Preloaded from assets/pcb_model.stl)
    // ============================================
    const canvas3d = document.getElementById('stlCanvas');
    if (canvas3d) {
        try {
            const THREE = await import('three');
            const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
            const { STLLoader } = await import('three/addons/loaders/STLLoader.js');
            
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x11161f);
            const camera = new THREE.PerspectiveCamera(45, canvas3d.clientWidth / canvas3d.clientHeight, 0.1, 1000);
            camera.position.set(3, 2.5, 5);
            const renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true });
            const controls = new OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.rotateSpeed = 1.5;
            controls.zoomSpeed = 1.2;
            
            // Lighting
            const ambientLight = new THREE.AmbientLight(0x404060);
            scene.add(ambientLight);
            const dirLight = new THREE.DirectionalLight(0xffffff, 1);
            dirLight.position.set(1, 2, 1);
            scene.add(dirLight);
            const fillLight = new THREE.PointLight(0x5577aa, 0.4);
            fillLight.position.set(0.5, 1, 2);
            scene.add(fillLight);
            const backLight = new THREE.DirectionalLight(0x88aaff, 0.5);
            backLight.position.set(-1, 1, -1);
            scene.add(backLight);
            const gridHelper = new THREE.GridHelper(10, 20, 0x88aaff, 0x335588);
            scene.add(gridHelper);
            
            let currentModel = null;
            // Default fallback cube
            const defaultCubeGeo = new THREE.BoxGeometry(1, 1, 1);
            const defaultMat = new THREE.MeshStandardMaterial({ color: 0x5a8ed9, transparent: true, opacity: 0.6 });
            const defaultCube = new THREE.Mesh(defaultCubeGeo, defaultMat);
            const edges = new THREE.EdgesGeometry(defaultCubeGeo);
            const wireMat = new THREE.LineBasicMaterial({ color: 0xffaa66 });
            const wireframeObj = new THREE.LineSegments(edges, wireMat);
            defaultCube.add(wireframeObj);
            scene.add(defaultCube);
            currentModel = defaultCube;
            
            function resizeCanvas3d() {
                const width = canvas3d.clientWidth;
                const height = canvas3d.clientHeight;
                renderer.setSize(width, height);
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
            }
            
            window.addEventListener('resize', () => resizeCanvas3d());
            setTimeout(resizeCanvas3d, 100);
            
            function animate() {
                requestAnimationFrame(animate);
                controls.update();
                renderer.render(scene, camera);
            }
            animate();
            
            const resetViewBtn = document.getElementById('resetViewBtn');
            if (resetViewBtn) resetViewBtn.onclick = () => {
                camera.position.set(3, 2.5, 5);
                controls.target.set(0, 0, 0);
                controls.update();
            };
            
            let wireframeMode = false;
            const toggleWireframeBtn = document.getElementById('toggleWireframe');
            if (toggleWireframeBtn) toggleWireframeBtn.onclick = () => {
                if (currentModel) {
                    wireframeMode = !wireframeMode;
                    currentModel.traverse(child => { if (child.isMesh) child.material.wireframe = wireframeMode; });
                }
            };
            
            // Load STL from assets/pcb_model.stl
            const stlLoader = new STLLoader();
            const stlPath = 'assets/Dragon 2.5_stl.stl';
            fetch(stlPath)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP ${response.status} - STL not found`);
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => {
                    const geometry = stlLoader.parse(arrayBuffer);
                    const material = new THREE.MeshStandardMaterial({ color: 0x6ea8fe, roughness: 0.3, metalness: 0.7 });
                    const mesh = new THREE.Mesh(geometry, material);
                    if (currentModel) scene.remove(currentModel);
                    currentModel = mesh;
                    scene.add(mesh);
                    // Center model
                    const box = new THREE.Box3().setFromObject(mesh);
                    const center = box.getCenter(new THREE.Vector3());
                    mesh.position.sub(center);
                    controls.target.set(0, 0, 0);
                    camera.position.set(2, 1.8, 3.5);
                    controls.update();
                })
                .catch(err => {
                    console.warn("STL not found at", stlPath, err);
                    const infoDiv = document.querySelector('.stl-viewer-area .info-text');
                    if (infoDiv) infoDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> PCB STL not found at assets/pcb_model.stl. Please add your 3D model file.';
                });
                
        } catch (error) {
            console.error("Failed to load Three.js modules:", error);
        }
    }