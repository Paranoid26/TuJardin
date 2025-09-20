document.addEventListener("DOMContentLoaded", () => {
    /* -------------------------
        ELEMENTOS PRINCIPALES (CONSTANTES)
    ------------------------- */
    const startBtn = document.getElementById("start-btn"); //Boton inicio
    const screens = document.querySelectorAll(".screen");
    const garden = document.getElementById("garden"); // campo (escena 1)
    const finalScreen = document.getElementById("final-screen");
    const inventoryEl = document.getElementById("inventory-list");
    const inventoryCountEl = document.getElementById("inventory-count");
    const scene1 = document.getElementById("scene-1"); //Bienvenida
    const scene2 = document.getElementById("scene-2"); //Minijuego
    const scene3 = document.getElementById("scene-3"); //Final
    const transitionFlower = document.getElementById("transition-flower");
    const windArea = document.getElementById("wind-area");
    const basket = document.getElementById("basket");
    const palette = document.getElementById("palette");
    const bouquetArea = document.getElementById("bouquet-area");
    const finalImg = document.getElementById("final-illustration");
    let totalFlowersCollected = 0;
    // Array por si quisieramos añadir más flores
    // Recuerda comentar el css de flower si lo usas
    const flowerTypes = [
        '../assets/img/flor.png',
        '../assets/img/girasol.png',
        '../assets/img/rosa.png'
    ];
    //Definimos un punto para preparar el ramo
    const BOUQUET_CENTER_X = 320;
    const BOUQUET_CENTER_Y = 250;

    /* -------------------------
        CONFIGURACIÓN DEL JUEGO
    ------------------------- */
    const REQUIRED_STAGE1 = 7; // Flores que se recogeran en la primera parte
    const TARGET_TOTAL = 25;   // Flores totales para el ramo
    let inventory = []; // Items en el inventario {id,type}
    let placedFlowers = []; // ids colocadas en el ramo
    let placedDecors = new Set();
    let stage = 0; // Escenas o partes de la página: 0 inicial, 1 campo, 2 viento, 3 taller
    let flowerIdCounter = 0;
    let windInterval = null;

    /* =============== Botón de continuar -> ANIMACIÓN TRANSICIÓN =============== */
    startBtn.addEventListener("click", () => {
        // Flor de transición: crece y cambiamos al minijuego
        gsap.set(transitionFlower, {opacity: 1, scale: 0.1, transformOrigin: "50% 50%"});
        gsap.to(transitionFlower, {
            scale: 30,
            duration: 1.2,
            ease: "power2.inOut",
            onComplete: () => {
                // Cambiamos de pantalla a garden-screen
                document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
                document.getElementById("garden-screen").classList.add("active");

                // Contraemos la flor y desaparece
                gsap.to(transitionFlower, {
                    scale: 0.1,
                    duration: 1,
                    ease: "power2.inOut",
                    opacity: 0,
                    onComplete: () => {
                        startStage1();
                    }
                });
            }
        });
    });

    /* ========================================================
        ---------- ESCENA 1: CAMPO DE FLORES --------------------
    ======================================================== */
    function startStage1() {
        stage = 1;
        inventory = [];
        placedFlowers = [];
        placedDecors = new Set();
        refreshInventoryUI();
        openScene(1);

        garden.innerHTML = "";
        // Aseguramos que garden tenga algo de altura para posicionar flores
        if (!garden.style.minHeight) garden.style.minHeight = '320px';

        //Aseguramos al menos una flor de cada tipo
        //flowerTypes.forEach(type => spawnFieldFlower(type));

        /*Añadir flores extra aleatorias
        for (let i = 0; i < REQUIRED_STAGE1 - flowerTypes.length; i++) {
            const randomType = flowerTypes[Math.floor(Math.random() * flowerTypes.length)];
            spawnFieldFlower(randomType);
        } */
        for (let i = 0; i < REQUIRED_STAGE1; i++) {
            spawnFieldFlower();
        }
    }
    //Colocamos las flores al azar
    /* Si quisierammos añadir más flores, pero también habría que modificar el resto del código, porque por ejemplo
    no saldrían al recogerlos con la cesta:
    function spawnFieldFlower(imageUrl) { ...
    */
    function spawnFieldFlower() {
        const flower = document.createElement("div");
        flower.className = "flower field-flower";
        flower.dataset.id = `f-${++flowerIdCounter}`;
        flower.dataset.type = "flower";

        //Nos aseguramos que las flores no se acerquen al borde
        const flowerSize = 56;
        // Posición aleatoria dentro del contenedor garden
        const padding = 24;
        const W = garden.clientWidth;
        const H = garden.clientHeight;
        const x = Math.random() * (W - flowerSize - padding * 2) + padding;
        // Si quisieramos que se repartiera por toda la pantalla y no solo por la mitad
        // const y = Math.random() * (H - padding * 2) + padding;
        const yMin = H * 0.65;// Dividimos el contenedor a la mitad
        const yMax = H - flowerSize - padding;
        const y = Math.random() * (yMax - yMin) + yMin;
        flower.style.position = "absolute";
        flower.style.left = `${x}px`;
        flower.style.top = `${y}px`;
        flower.style.cursor = "pointer";
        //Lo añadimos en caso de colocar más flores
        // flower.style.background = `url('${imageUrl}') center/contain no-repeat`;
        
        // Animación de entrada
        gsap.fromTo(flower, {
            scale: 0, 
            opacity: 0
        }, 
        {scale: 1, 
            opacity: 1, 
            duration: 0.5, 
            ease: "back.out(1.4)"
        });
        garden.appendChild(flower);

        flower.addEventListener("click", onFieldFlowerClick);
    }

    function onFieldFlowerClick(e) {
        const node = e.currentTarget;
        node.removeEventListener("click", onFieldFlowerClick);
        collectFlowerFromNode(node);
    }

    function collectFlowerFromNode(node) {
        // Animación de las flores hacia el inventario
        const rect = node.getBoundingClientRect();
        const invRect = inventoryEl.getBoundingClientRect();

        const clone = node.cloneNode(true);
        clone.style.position = "fixed";
        clone.style.left = `${rect.left}px`;
        clone.style.top = `${rect.top}px`;
        clone.style.margin = 0;
        clone.style.zIndex = 2000;
        document.body.appendChild(clone);

        gsap.to(clone, {
            duration: 0.8,
            left: invRect.left + 10 + Math.random() * 40,
            top: invRect.top + 10 + Math.random() * 40,
            scale: 0.6,
            ease: "power2.inOut",
            onComplete: () => {
                inventory.push({ id: node.dataset.id || `item-${Date.now()}`, type: "flower" });
                refreshInventoryUI();
                clone.remove();
                node.remove();

                if (inventory.length >= REQUIRED_STAGE1 && stage === 1) {
                    triggerWindTakeaway();
                }
            }
        });
    }

    /* -------------------------
        VIENTO: las flores se llevan el ramo
    ------------------------- */
    function triggerWindTakeaway() {
        showNarrative("¡Cuidado!, una ráfaga de viento se ha llevado tus flores");
        createPetalBurst();

        // Animación de las flores del inventario volando (simulación)
        const invCopy = inventory.slice();
        inventory = [];
        refreshInventoryUI();

        // Después de la ráfaga, pasamos a la escena 2
        gsap.delayedCall(4.5, () => {
            transitionToStage2();
        });
    }

    function createPetalBurst() {
        const N = 18;
        for (let i = 0; i < N; i++) {
            const petal = document.createElement("div");
            petal.className = "petal";
            document.body.appendChild(petal);
            const startX = window.innerWidth * 0.5 + (Math.random() - 0.5) * 200;
            const startY = window.innerHeight * 0.48 + (Math.random() - 0.5) * 200;
            petal.style.left = `${startX}px`;
            petal.style.top = `${startY}px`;
            const destX = window.innerWidth + 100 + Math.random() * 400;
            const destY = (Math.random() - 0.2) * window.innerHeight;

            gsap.to(petal, {
                duration: 4 + Math.random() * 1.5,
                left: destX,
                top: destY,
                rotation: Math.random() * 720,
                ease: "power1.out",
                opacity: 0,
                onComplete: () => petal.remove()
            });
        }
    }

    /* ========================================================
    ---------- ESCENA 2: FLORES AL VIENTO -------------------
    ======================================================== */
    function transitionToStage2() {
        stage = 2;
        openScene(2);
        refreshInventoryUI();

        // Mostramos la cesta
        basket.style.display = "block";

        // Esperamos un frame para que el DOM lo renderice
        requestAnimationFrame(() => {
            const basketWidth = basket.offsetWidth;
            const basketHeight = basket.offsetHeight;
            /*Error de cesta y puntero, comprobamos en la consola del navegador su valor por si llega
            a ser algo de javascript o el css*/
            console.log("Tamaño cesta: ", basketWidth, basketHeight);

            const x = window.innerWidth / 2 - basketWidth / 2;
            const y = window.innerHeight - 120 - basketHeight / 2;

            basket.style.left = `${x}px`;
            basket.style.top = `${y}px`;
        });

        // Mostramos la lluvia de flores arrastradas por el viento
        startWindFlowerRain();
        document.addEventListener("mousemove", onMouseMoveBasket);
    }

    function startWindFlowerRain() {
        clearInterval(windInterval);
        windInterval = setInterval(() => {
            // Si alcanzamos el objetivo => terminar
            if (inventory.length >= TARGET_TOTAL) {
                clearInterval(windInterval);
                onReachTargetInWind();
                return;
            }
            spawnWindFlower();
        }, 600 + Math.random() * 300);
    }

    function spawnWindFlower() {
        const bounds = document.querySelector('.wind-bg').getBoundingClientRect();

        const fl = document.createElement("div");
        fl.className = "flower wind-flower";
        fl.dataset.id = `f-${++flowerIdCounter}`;
        fl.dataset.type = "flower";
        fl.style.position = "absolute";
        const startX = Math.random() * bounds.width;
        fl.style.left = `${startX}px`;
        fl.style.top = `-80px`;
        windArea.appendChild(fl);

        //Variables para calcular la caida de las flores
        const minPercent = 0.8;
        const maxPercent = 0.9;

        const fallPercent = minPercent + Math.random() * (maxPercent - minPercent);
        const endY = bounds.height * fallPercent;
        const destX = startX + (Math.random() - 0.5) * 300;
        const duration = 3 + Math.random() * 2;
        gsap.to(fl, {
            duration, 
            top: endY + "px", 
            left: destX + "px", 
            rotation: (Math.random() * 80 - 40), 
            ease: "power1.inOut"
        });

        fl.addEventListener("click", () => catchWindFlower(fl));

        // Colisión con cesta
        const interval = setInterval(() => {
            if (!document.body.contains(fl)) {
                clearInterval(interval);
                return;
            }
            if (isColliding(fl, basket)) {
                clearInterval(interval);
                catchWindFlower(fl);
            }
        }, 70);

        // Eliminamos la flor si despues de un rato no se recoge
        gsap.delayedCall(8, () => { if (document.body.contains(fl)) fl.remove(); });
    }

    function onMouseMoveBasket(e) {
        const basketWidth = basket.offsetWidth || 84;
        const basketHeight = basket.offsetHeight || 64;

        const x = e.clientX - (basketWidth / 2);
        const y = e.clientY - (basketHeight / 2);
        const left = Math.max(0, Math.min(x, window.innerWidth - basketWidth));
        const top = Math.max(0, Math.min(y, window.innerHeight - basketHeight));
        basket.style.left = `${left}px`;
        basket.style.top = `${top}px`;
    }

    function catchWindFlower(node) {
        const rect = node.getBoundingClientRect();
        const invRect = inventoryEl.getBoundingClientRect();
        const clone = node.cloneNode(true);
        clone.style.position = "fixed";
        clone.style.left = `${rect.left}px`;
        clone.style.top = `${rect.top}px`;
        clone.style.margin = 0;
        clone.style.zIndex = 2000;
        document.body.appendChild(clone);

        gsap.to(clone, {
            duration: 0.7,
            left: invRect.left + 10 + Math.random() * 40,
            top: invRect.top + 10 + Math.random() * 40,
            scale: 0.6,
            ease: "power2.inOut",
            onComplete: () => {
                inventory.push({ id: node.dataset.id || `item-${Date.now()}`, type: "flower" });
                refreshInventoryUI();
                clone.remove();
                node.remove();

                if (inventory.length >= TARGET_TOTAL && stage === 2) {
                    onReachTargetInWind();
                }
            }
        });
    }

    function isColliding(a, b) {
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        return !(ra.right < rb.left || ra.left > rb.right || ra.bottom < rb.top || ra.top > rb.bottom);
    }

    function onReachTargetInWind() {
        const invWrap = document.getElementById("inventory");
        gsap.fromTo(invWrap, {scale: 1}, {scale: 1.06, duration: 0.35, yoyo: true, repeat: 3, ease: "power1.inOut"});
        showNarrative("El viento se llevó tus flores, pero también te regaló más para tu ramo.");
        // limpiamos la anterior pantalla
        gsap.to(scene2, {
            opacity: 0,
            duration: 3.5,
            onComplete: () => {
                scene2.style.display = "none";
                scene2.style.opacity = "";
                document.removeEventListener("mousemove", onMouseMoveBasket);
                basket.style.display = "none";
                transitionToStage3();
            }
        });
    }

    /* ========================================================
    ---------- ESCENA 3: TALLER (ARMAR RAMO) ----------------
    ======================================================== */
    function transitionToStage3() {
        stage = 3;
        scene3.style.opacity = 0;
        scene3.style.display = "block";
        openScene(3); // ya activa .active

        // Guardamos las flores recolectadas
        totalFlowersCollected = inventory.length;

        gsap.to(scene3, {
            opacity: 1,
            duration: 1.5,
            onComplete: () => {
                populateWorkshopFromInventory();
            }
        });
    }

    function populateWorkshopFromInventory() {
        const flowersBucket = palette.querySelector(".flowers-bucket");
        if (!flowersBucket) return;
        flowersBucket.innerHTML = "";

        inventory.forEach((item) => {
            const f = document.createElement("div");
            f.className = "workshop-flower";
            f.draggable = true;
            f.dataset.id = item.id;
            flowersBucket.appendChild(f);

            f.addEventListener("dragstart", onDragStart);
            f.addEventListener("click", () => placeFlowerInBouquet(item.id, f));
        });

        const decorItems = document.querySelectorAll(".decor-item");
        decorItems.forEach(d => {
            d.draggable = true;
            d.addEventListener("dragstart", (ev) => {
                ev.dataTransfer.setData("text/plain", "decor:" + d.dataset.decor);
            });
        });

        bouquetArea.addEventListener("dragover", ev => ev.preventDefault());
        bouquetArea.addEventListener("drop", ev => {
            ev.preventDefault();
            const data = ev.dataTransfer.getData("text/plain");
            if (data && data.startsWith("decor:")) {
                const decorName = data.split(":")[1];
                placeDecorInBouquet(decorName);
                return;
            }
            const id = data;
            const node = document.querySelector(`.workshop-flower[data-id="${id}"]`);
            if (node) placeFlowerInBouquet(id, node);
        });
    }

    function onDragStart(ev) {
        const id = ev.target.dataset.id;
        ev.dataTransfer.setData("text/plain", id);
        const img = document.createElement("canvas");
        img.width = 1; img.height = 1;
        ev.dataTransfer.setDragImage(img, 0, 0);
    }

    function placeFlowerInBouquet(id, nodeRef) {
        if (placedFlowers.includes(id)) return;
        const elm = document.createElement("div");
        elm.className = "placed-flower";
        elm.dataset.id = id;
        elm.style.position = "absolute";
        // elm.style.left = `${30 + Math.random() * 140}px`;
        // elm.style.top = `${30 + Math.random() * 140}px`;
        const offsetX = (Math.random() - 0.5) * 60;
        const offsetY = (Math.random() - 0.5) *60;
        elm.style.left = `${BOUQUET_CENTER_X + offsetX}px`;
        elm.style.top = `${BOUQUET_CENTER_Y + offsetY}px`;
        elm.style.transform = `scale(0) rotate(${Math.random() * 20 - 10}deg)`;
        bouquetArea.appendChild(elm);
        gsap.to(elm, {scale: 1, duration: 0.45, ease: "back.out(1.5)"});
        placedFlowers.push(id);

        if (nodeRef && nodeRef.parentElement) nodeRef.remove();
        checkBouquetCompletion();
    }

    function placeDecorInBouquet(decorName) {
        if (placedDecors.has(decorName)) return;

        // Posiciones personalizadas según tipo de decoración
        let x = BOUQUET_CENTER_X;
        let y = BOUQUET_CENTER_Y;

        switch (decorName) {
            case "paper":
                y += 40; // papel debajo del ramo
                break;
            case "ribbon":
                y += 60; // cinta más abajo, como si lo atara
                break;
            case "twigs":
                y -= 40; // ramitas detrás del ramo
                break;
        }

        const d = document.createElement("div");
        d.className = `placed-decor decor-${decorName}`;
        // d.innerText = decorName;
        d.style.position = "absolute";
        d.style.left = `${x}px`;
        d.style.top = `${y}px`;
        d.style.transform = "translate(-50%, -50%)";
        bouquetArea.appendChild(d);

        placedDecors.add(decorName);

        if (decorName === "twigs") {
            // Ramita izquierda
            const leftTwig = document.createElement("div");
            leftTwig.className = "placed-decor decor-twigs";
            leftTwig.style.position = "absolute";
            leftTwig.style.left = `${BOUQUET_CENTER_X - 55}px`;
            leftTwig.style.top = `280px`;
            leftTwig.style.transform = "translate(-50%, -50%) rotate(-15deg)";
            bouquetArea.appendChild(leftTwig);

            // Ramita derecha invertida
            const rightTwig = document.createElement("div");
            rightTwig.className = "placed-decor decor-twigs";
            rightTwig.style.position = "absolute";
            rightTwig.style.left = `${BOUQUET_CENTER_X + 55}px`;
            rightTwig.style.top = `280px`;
            rightTwig.style.transform = "translate(-50%, -50%) scaleX(-1) rotate(15deg)";
            bouquetArea.appendChild(rightTwig);

            placedDecors.add(decorName);
            checkBouquetCompletion();
            return;
        }

        if (decorName === "ribbon") {
            showNarrative("La última cinta lo hace perfecto");
        }
        checkBouquetCompletion();
    }

    function checkBouquetCompletion() {
        const allFlowersPlaced = placedFlowers.length >= totalFlowersCollected;
        const allDecorPlaced = placedDecors.has("paper") && placedDecors.has("ribbon") && placedDecors.has("twigs");

        if (allFlowersPlaced && allDecorPlaced) {
            finishBouquet();
        } else {
            if (placedFlowers.length > 0 && !allFlowersPlaced) {
                showNarrative("El ramo comienza a tomar forma");
            }
        }
    }

    function finishBouquet() {
        showNarrative("Tu ramo está listo...");
        gsap.fromTo(bouquetArea, 
            {scale: 0.98}, 
            {scale: 1.02, duration: 0.5, yoyo: true, repeat: 3, ease: "sine.inOut"});
        
        gsap.delayedCall(4, () => {
            gsap.to(document.getElementById("garden-screen"), {
                opacity: 0,
                duration: 0.8,
                onComplete: () => {
                    showFinalScreenWithIllustration();
                }
            });
        });
    }

    function showFinalScreenWithIllustration() {
        // Mostramos el mensaje inicial
        showNarrative("Tu ramo está listo...");

        // Esperar 3 segundos antes de mostrar la escena final
        gsap.delayedCall(3, () => {
            // Restauramos la opacidad de la pantalla del jardín (por si se ocultó)
            document.getElementById("garden-screen").style.opacity = "";
            // Ocultamos todas las pantallas
            document.querySelectorAll(".screen").forEach(screen => screen.classList.remove("active"));
            // Preparamos la pantalla final
            finalScreen.style.opacity = 0;
            finalScreen.classList.add("active");
            // Animamos la aparición de la pantalla final
            gsap.to(finalScreen, { opacity: 1, duration: 1 });

            // Si existe una imagen final, mostrarla con animación
            if (finalImg) {
                finalImg.style.display = "block";
                gsap.fromTo(finalImg,
                    { 
                        opacity: 0, 
                        scale: 0.95 
                    },
                    { 
                        opacity: 1, 
                        scale: 1, 
                        duration: 1, 
                        ease: "power2.out"
                    }
                );
            }

            // Reseteamos índice y actualizamos el diálogo
            currentIndex = 0;
            updateDialog();
        });
    }

    /* ==========================
        Helpers: UI / Inventario
    ========================== */
    function refreshInventoryUI() {
        inventoryEl.innerHTML = "";
        inventory.forEach(item => {
            const el = document.createElement("div");
            el.className = "inv-item";
            el.dataset.id = item.id;
            el.title = item.type;
            inventoryEl.appendChild(el);
        });

        // Determinamos el objetivo total basado en la escena
        const totalGoal = (stage === 1) ? REQUIRED_STAGE1 : TARGET_TOTAL;

        // Actualizamos el contador con el objetivo correcto
        inventoryCountEl.textContent = `${inventory.length} / ${totalGoal}`;
    }

    function openScene(n) {
        [scene1, scene2, scene3].forEach(sc => {
            if (!sc) return;
            sc.style.display = "none";
            sc.classList.remove("active");
        });
        const sc = n === 1 ? scene1 : n === 2 ? scene2 : scene3;
        if (sc) {
            sc.style.display = "block";
            sc.classList.add("active");
        }
    }

    function showNarrative(text) {
        let overlay = document.getElementById("narrative-overlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "narrative-overlay";
            overlay.className = "narrative-overlay";
            overlay.style.position = "fixed";
            overlay.style.top = 0;
            overlay.style.left = "10%";
            overlay.style.right = 0;
            overlay.style.bottom = 0;
            overlay.style.display = "flex";
            overlay.style.alignItems = "center";
            overlay.style.justifyContent = "center";
            overlay.style.pointerEvents = "none";
            overlay.style.zIndex = 9999;
            overlay.style.fontSize = "20px";
            overlay.style.fontWeight = "700";
            overlay.style.color = "#fff";
            overlay.style.textShadow = "0 2px 8px rgba(0,0,0,0.4)";
            document.body.appendChild(overlay);
        }
        overlay.textContent = text;
        gsap.fromTo(overlay, 
            {opacity: 0}, 
            {opacity: 1, duration: 0.6});
        gsap.delayedCall(3.5, () => gsap.to(overlay, 
            {opacity: 0, duration: 0.6}
        ));
    }

    /* ==========================
    Reinicio / Botón volver al inicio
    ========================== */
    const backBtn = document.getElementById("back-to-start");
    backBtn.addEventListener("click", () => {
        document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
        document.getElementById("welcome-screen").classList.add("active");

        inventory = [];
        placedFlowers = [];
        placedDecors = new Set();
        refreshInventoryUI();
        garden.innerHTML = "";
        if (windArea) windArea.innerHTML = "";
        if (bouquetArea) bouquetArea.innerHTML = "<div class='placeholder'>Arrastra aquí tus flores</div>";
        clearInterval(windInterval);
        document.removeEventListener("mousemove", onMouseMoveBasket);
        stage = 0;
        flowerIdCounter = 0;
    });

    /* ========================================================
    ------------------ DIÁLOGO -----------
    ======================================================== */
    const seenMessages = new Set();
    const dialogMessages = [
        "Wow",
        "...",
        "Que flores tan bonitas has recogido.\nTe ha quedado un ramo realmente precioso.",
        "...",
        "No puedo quedarme atrás.",
        "Mmm...",
        "¡Claro! Ya lo tengo.",
        "Quizás uno de verdad no estaría mal...",
        "Supongo que ya sabes a que me refiero :P\nY no es una broma, lo digo totalmente serio, mira:\n>: |",
        "Y no te preocupes, ya todo está planeado.",
        "Bueno, casi todo...\nSolo falta decidir dónde te lo entregarán.",
        "Me tienes que dar una dirección para que puedan llevartelo y también para saber si te lo pueden llevar.",
        "Sino ya veré como puedo resolverlo, pero tendrían que poder llevartelo.",
        "Sí, ya sé que se pierde un poco la sorpresa...\npero estoy seguro que te va a encantar igualmente.",
        "Con cariño,\n Miguel❤",
        "P.D.: Puedes abrir y cerrar este diálogo para ver el fondo :)"
    ];

    let currentIndex = 0;
    const dialogText = document.getElementById("dialog-text");
    const nextBtn = document.getElementById("next-btn");
    const prevBtn = document.getElementById("prev-btn");
    const closeBtn = document.querySelector(".close-btn");
    const dialogBox = document.getElementById("dialog-box");
    const reopenBtn = document.getElementById("reopen-dialog");

    function updateDialog() {
        const message = dialogMessages[currentIndex];
        dialogText.textContent = "";
        prevBtn.disabled = true;
        nextBtn.disabled = true;

        if (seenMessages.has(currentIndex)) {
            dialogText.textContent = message;
            prevBtn.disabled = currentIndex === 0;
            nextBtn.disabled = currentIndex === dialogMessages.length - 1;
            return;
        }

        let charIndex = 0;
        const typingSpeed = 40;

        function typeChar() {
            if (charIndex < message.length) {
                dialogText.textContent += message.charAt(charIndex);
                charIndex++;
                setTimeout(typeChar, typingSpeed);
            } else {
                seenMessages.add(currentIndex);
                prevBtn.disabled = currentIndex === 0;
                nextBtn.disabled = currentIndex === dialogMessages.length - 1;
            }
        }

        typeChar();
    }

    nextBtn.addEventListener("click", () => {
        if (currentIndex < dialogMessages.length - 1) {
            currentIndex++;
            updateDialog();
        }
    });

    prevBtn.addEventListener("click", () => {
        if (currentIndex > 0) {
        currentIndex--;
        updateDialog();
        }
    });

    closeBtn.addEventListener("click", () => {
        dialogBox.style.display = "none";
        reopenBtn.style.display = "block";
    });

    reopenBtn.addEventListener("click", () => {
        dialogBox.style.display = "flex";
        reopenBtn.style.display = "none";
        updateDialog();
    });

    /* ========================================================
    ------------------ REPRODUCTOR DE MÚSICA -----------------
    ======================================================== */
    const tracks = [
        {
            title: "The Lakes",
            artist: "Taylor Swift",
            src: "../assets/audio/TheLakes.mp3",
            image: "../assets/img/Folklore.webp"
        },
        {
            title: "Daylight",
            artist: "Taylor Swift",
            src: "../assets/audio/Daylight.mp3",
            image: "../assets/img/Lover.jpg"
        },
        {
            title: "Formidable",
            artist: "Twenty One Pilots",
            src: "../assets/audio/Formidable.mp3",
            image: "../assets/img/SAI.jpg"
        },
        {
            title: "Robot Voices",
            artist: "Twenty One Pilots",
            src: "../assets/audio/RobotVoices.mp3",
            image: "../assets/img/Breach.jpg"
        },
        {
            title: "Flores Amarillas",
            artist: "Floricienta",
            src: "../assets/audio/FloresAmarillas.mp3",
            image: "../assets/img/Floricienta.webp"
        }
    ];

    let currentTrackIndex = 0;
    let sound;
    let isPlaying = false;
    let progressInterval;

    // Elementos UI
    const playPauseBtn = document.getElementById("play-pause-btn");
    const musicNextBtn = document.getElementById("music-next-btn");
    const musicPrevBtn = document.getElementById("music-prev-btn");
    const trackTitle = document.getElementById("track-title");
    const trackArtist = document.getElementById("track-artist");
    const trackImage = document.getElementById("track-image");
    const progressBar = document.getElementById("progress-bar");
    const currentTimeEl = document.getElementById("current-time");
    const durationEl = document.getElementById("duration");

    function updatePlayerUI(index) {
        const track = tracks[index];
        trackTitle.textContent = track.title;
        trackArtist.textContent = track.artist;
        trackImage.src = track.image;
    }

    function playTrack(index) {
        if (sound) {
            sound.unload();
            clearInterval(progressInterval);
        }

        const track = tracks[index];
        sound = new Howl({
            src: [track.src],
            html5: true,
            volume: 1,
            onend: () => {
                currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
                playTrack(currentTrackIndex);
            },
            onload: () => {
                durationEl.textContent = formatTime(sound.duration());
            }
        });

        updatePlayerUI(index);
        sound.play();
        isPlaying = true;
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';

        progressInterval = setInterval(() => {
            const seek = sound.seek();
            if (sound && sound.duration()) {
                progressBar.value = (seek / sound.duration()) * 100;
                currentTimeEl.textContent = formatTime(seek);
            }
        }, 500);
    }

    playPauseBtn.addEventListener("click", () => {
        if (!sound) {
            playTrack(currentTrackIndex);
        } else if (isPlaying) {
            sound.pause();
            isPlaying = false;
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            sound.play();
            isPlaying = true;
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        }
    });

    musicNextBtn.addEventListener("click", () => {
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        playTrack(currentTrackIndex);
    });

    musicPrevBtn.addEventListener("click", () => {
        currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
        playTrack(currentTrackIndex);
    });

    progressBar.addEventListener("input", () => {
        if (sound && sound.duration()) {
            const seek = (progressBar.value / 100) * sound.duration();
            sound.seek(seek);
        }
    });

    function formatTime(sec) {
        const minutes = Math.floor(sec / 60) || 0;
        const seconds = Math.floor(sec % 60) || 0;
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    }

    updatePlayerUI(currentTrackIndex);

    // Movilidad reproductor
    const musicPlayer = document.getElementById("music-player");
    let isDragging = false;
    let offsetX, offsetY;
    musicPlayer.addEventListener("mousedown", (e) => {
        isDragging = true;
        offsetX = e.clientX - musicPlayer.getBoundingClientRect().left;
        offsetY = e.clientY - musicPlayer.getBoundingClientRect().top;
        musicPlayer.style.transition = "none";
    });
    document.addEventListener("mousemove", (e) => {
        if (isDragging) {
            const playerWidth = musicPlayer.offsetWidth;
            const playerHeight = musicPlayer.offsetHeight;
            const maxLeft = window.innerWidth - playerWidth;
            const maxTop = window.innerHeight - playerHeight;
            let newLeft = e.clientX - offsetX;
            let newTop = e.clientY - offsetY;
            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));
            musicPlayer.style.left = `${newLeft}px`;
            musicPlayer.style.top = `${newTop}px`;
        }
    });
    document.addEventListener("mouseup", () => { isDragging = false; });
});
