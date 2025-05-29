 // Global variables
        let constraints = [];
        let constraintCount = 0;

        // Initialize the application
        document.addEventListener('DOMContentLoaded', function() {
            addConstraint(); // Add default constraint
            addConstraint(); // Add second default constraint
            generateMatrices(); // Generate default matrices
        });

        // Tab switching with animations
        function showTab(tabName) {
            // Hide all tabs with fade effect
            const linearTab = document.getElementById('linear-tab');
            const matricesTab = document.getElementById('matrices-tab');
            
            linearTab.style.opacity = '0';
            matricesTab.style.opacity = '0';
            
            setTimeout(() => {
                linearTab.classList.add('hidden');
                matricesTab.classList.add('hidden');
                
                // Remove active styles
                const tabLinear = document.getElementById('tab-linear');
                const tabMatrices = document.getElementById('tab-matrices');
                
                tabLinear.classList.remove('text-blue-600', 'border-b-3', 'border-blue-600', 'bg-white');
                tabMatrices.classList.remove('text-blue-600', 'border-b-3', 'border-blue-600', 'bg-white');
                tabLinear.classList.add('text-gray-500');
                tabMatrices.classList.add('text-gray-500');
                
                // Show selected tab with fade in
                if (tabName === 'linear') {
                    linearTab.classList.remove('hidden');
                    tabLinear.classList.add('text-blue-600', 'border-b-3', 'border-blue-600', 'bg-white');
                    tabLinear.classList.remove('text-gray-500');
                    setTimeout(() => linearTab.style.opacity = '1', 50);
                } else {
                    matricesTab.classList.remove('hidden');
                    tabMatrices.classList.add('text-blue-600', 'border-b-3', 'border-blue-600', 'bg-white');
                    tabMatrices.classList.remove('text-gray-500');
                    setTimeout(() => matricesTab.style.opacity = '1', 50);
                }
            }, 150);
        }

        // Linear Programming Functions
        function addConstraint() {
            constraintCount++;
            const container = document.getElementById('constraints-container');
            const constraintDiv = document.createElement('div');
            constraintDiv.className = 'flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in';
            constraintDiv.id = `constraint-${constraintCount}`;
            
            constraintDiv.innerHTML = `
                <div class="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    ${constraintCount}
                </div>
                <input type="number" value="1" class="matrix-input" id="a${constraintCount}1" placeholder="a₁">
                <span class="text-gray-600 font-medium">x₁ +</span>
                <input type="number" value="1" class="matrix-input" id="a${constraintCount}2" placeholder="a₂">
                <span class="text-gray-600 font-medium">x₂</span>
                <select class="border-2 border-gray-200 rounded-lg px-3 py-2 bg-white shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all" id="sign${constraintCount}">
                    <option value="<=">≤</option>
                    <option value=">=">≥</option>
                    <option value="=">=</option>
                </select>
                <input type="number" value="4" class="matrix-input" id="b${constraintCount}" placeholder="b">
            `;
            
            container.appendChild(constraintDiv);
        }

        function removeConstraint() {
            if (constraintCount > 1) {
                const constraint = document.getElementById(`constraint-${constraintCount}`);
                if (constraint) {
                    constraint.remove();
                    constraintCount--;
                }
            }
        }

        function solveLinearProblem() {
            try {
                // Get objective function coefficients
                const c1 = parseFloat(document.getElementById('c1').value) || 0;
                const c2 = parseFloat(document.getElementById('c2').value) || 0;
                const isMaximize = document.getElementById('objective-type').value === 'max';

                // Get constraints
                const constraints = [];
                for (let i = 1; i <= constraintCount; i++) {
                    const a1 = parseFloat(document.getElementById(`a${i}1`).value) || 0;
                    const a2 = parseFloat(document.getElementById(`a${i}2`).value) || 0;
                    const sign = document.getElementById(`sign${i}`).value;
                    const b = parseFloat(document.getElementById(`b${i}`).value) || 0;
                    constraints.push({ a1, a2, sign, b });
                }

                // Solve using graphical method
                const solution = solveGraphically(c1, c2, constraints, isMaximize);
                
                // Display results
                displayResults(solution, isMaximize);
                
                // Draw graph
                drawGraph(c1, c2, constraints, solution, isMaximize);

            } catch (error) {
                alert('Error al resolver el problema: ' + error.message);
            }
        }

        function solveGraphically(c1, c2, constraints, isMaximize) {
            // Find intersection points of constraints
            const points = [];
            
            // Add origin if feasible
            if (isFeasiblePoint(0, 0, constraints)) {
                points.push([0, 0]);
            }

            // Add axis intersections
            constraints.forEach(constraint => {
                if (constraint.sign === '<=' || constraint.sign === '=') {
                    // x1-axis intersection (x2 = 0)
                    if (constraint.a1 !== 0) {
                        const x1 = constraint.b / constraint.a1;
                        if (x1 >= 0 && isFeasiblePoint(x1, 0, constraints)) {
                            points.push([x1, 0]);
                        }
                    }
                    
                    // x2-axis intersection (x1 = 0)
                    if (constraint.a2 !== 0) {
                        const x2 = constraint.b / constraint.a2;
                        if (x2 >= 0 && isFeasiblePoint(0, x2, constraints)) {
                            points.push([0, x2]);
                        }
                    }
                }
            });

            // Find intersections between constraint lines
            for (let i = 0; i < constraints.length; i++) {
                for (let j = i + 1; j < constraints.length; j++) {
                    const intersection = findIntersection(constraints[i], constraints[j]);
                    if (intersection && intersection[0] >= 0 && intersection[1] >= 0 && 
                        isFeasiblePoint(intersection[0], intersection[1], constraints)) {
                        points.push(intersection);
                    }
                }
            }

            // Remove duplicates
            const uniquePoints = [];
            points.forEach(point => {
                const exists = uniquePoints.some(p => 
                    Math.abs(p[0] - point[0]) < 1e-6 && Math.abs(p[1] - point[1]) < 1e-6
                );
                if (!exists) {
                    uniquePoints.push(point);
                }
            });

            // Evaluate objective function at each corner point
            let optimalPoint = null;
            let optimalValue = isMaximize ? -Infinity : Infinity;

            uniquePoints.forEach(point => {
                const value = c1 * point[0] + c2 * point[1];
                if ((isMaximize && value > optimalValue) || (!isMaximize && value < optimalValue)) {
                    optimalValue = value;
                    optimalPoint = point;
                }
            });

            return {
                optimalPoint,
                optimalValue,
                cornerPoints: uniquePoints
            };
        }

        function findIntersection(constraint1, constraint2) {
            const { a1: a1_1, a2: a2_1, b: b1 } = constraint1;
            const { a1: a1_2, a2: a2_2, b: b2 } = constraint2;

            const determinant = a1_1 * a2_2 - a2_1 * a1_2;
            if (Math.abs(determinant) < 1e-10) return null; // Parallel lines

            const x1 = (b1 * a2_2 - b2 * a2_1) / determinant;
            const x2 = (a1_1 * b2 - a1_2 * b1) / determinant;

            return [x1, x2];
        }

        function isFeasiblePoint(x1, x2, constraints) {
            for (const constraint of constraints) {
                const lhs = constraint.a1 * x1 + constraint.a2 * x2;
                switch (constraint.sign) {
                    case '<=':
                        if (lhs > constraint.b + 1e-6) return false;
                        break;
                    case '>=':
                        if (lhs < constraint.b - 1e-6) return false;
                        break;
                    case '=':
                        if (Math.abs(lhs - constraint.b) > 1e-6) return false;
                        break;
                }
            }
            return true;
        }

        function displayResults(solution, isMaximize) {
            const resultsDiv = document.getElementById('results');
            const solutionText = document.getElementById('solution-text');
            
            if (solution.optimalPoint) {
                const [x1, x2] = solution.optimalPoint;
                const type = isMaximize ? 'Máximo' : 'Mínimo';
                
                solutionText.innerHTML = `
                    <div class="space-y-2">
                        <p><strong>Solución Óptima:</strong></p>
                        <p>x₁ = ${x1.toFixed(3)}</p>
                        <p>x₂ = ${x2.toFixed(3)}</p>
                        <p><strong>Valor ${type}:</strong> Z = ${solution.optimalValue.toFixed(3)}</p>
                        <p><strong>Puntos de Esquina Evaluados:</strong></p>
                        <ul class="list-disc list-inside ml-4">
                            ${solution.cornerPoints.map(point => 
                                `<li>(${point[0].toFixed(3)}, ${point[1].toFixed(3)})</li>`
                            ).join('')}
                        </ul>
                    </div>
                `;
            } else {
                solutionText.innerHTML = '<p class="text-red-600">No se encontró solución factible.</p>';
            }
            
            resultsDiv.classList.remove('hidden');
        }

        function drawGraph(c1, c2, constraints, solution, isMaximize) {
            const canvas = document.getElementById('graph-canvas');
            const ctx = canvas.getContext('2d');
            const width = canvas.width;
            const height = canvas.height;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Set up coordinate system
            const margin = 60; // Increased margin for labels
            const graphWidth = width - 2 * margin;
            const graphHeight = height - 2 * margin;
            
            // Find scale
            let maxX = 10, maxY = 10;
            constraints.forEach(constraint => {
                if (constraint.a1 > 0) maxX = Math.max(maxX, constraint.b / constraint.a1 * 1.2);
                if (constraint.a2 > 0) maxY = Math.max(maxY, constraint.b / constraint.a2 * 1.2);
            });
            if (solution.cornerPoints) {
                solution.cornerPoints.forEach(point => {
                    maxX = Math.max(maxX, point[0] * 1.2);
                    maxY = Math.max(maxY, point[1] * 1.2);
                });
            }

            // Smart scaling for large numbers
            function getSmartStep(max) {
                if (max <= 10) return 1;
                if (max <= 50) return 5;
                if (max <= 100) return 10;
                if (max <= 500) return 50;
                if (max <= 1000) return 100;
                if (max <= 5000) return 500;
                return Math.ceil(max / 10);
            }

            const stepX = getSmartStep(maxX);
            const stepY = getSmartStep(maxY);
            
            // Round up to nice numbers
            maxX = Math.ceil(maxX / stepX) * stepX;
            maxY = Math.ceil(maxY / stepY) * stepY;

            const scaleX = graphWidth / maxX;
            const scaleY = graphHeight / maxY;

            // Transform coordinates
            function toScreenX(x) { return margin + x * scaleX; }
            function toScreenY(y) { return height - margin - y * scaleY; }

            // Draw axes
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(margin, toScreenY(0));
            ctx.lineTo(width - margin, toScreenY(0));
            ctx.moveTo(toScreenX(0), margin);
            ctx.lineTo(toScreenX(0), height - margin);
            ctx.stroke();

            // Draw axis labels
            ctx.fillStyle = '#374151';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('x₁', width - margin + 10, toScreenY(0) + 5);
            ctx.fillText('x₂', toScreenX(0) - 20, margin - 10);

            // Draw grid with smart stepping
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.fillStyle = '#374151';
            ctx.font = '11px Arial';
            
            // X-axis grid and labels
            for (let i = stepX; i <= maxX; i += stepX) {
                if (i <= maxX) {
                    ctx.beginPath();
                    ctx.moveTo(toScreenX(i), margin);
                    ctx.lineTo(toScreenX(i), height - margin);
                    ctx.stroke();
                    
                    // Format numbers for display
                    const label = i >= 1000 ? (i / 1000).toFixed(1) + 'k' : i.toString();
                    const textWidth = ctx.measureText(label).width;
                    ctx.fillText(label, toScreenX(i) - textWidth/2, toScreenY(0) + 20);
                }
            }
            
            // Y-axis grid and labels
            for (let i = stepY; i <= maxY; i += stepY) {
                if (i <= maxY) {
                    ctx.beginPath();
                    ctx.moveTo(margin, toScreenY(i));
                    ctx.lineTo(width - margin, toScreenY(i));
                    ctx.stroke();
                    
                    // Format numbers for display
                    const label = i >= 1000 ? (i / 1000).toFixed(1) + 'k' : i.toString();
                    const textWidth = ctx.measureText(label).width;
                    ctx.fillText(label, toScreenX(0) - textWidth - 10, toScreenY(i) + 4);
                }
            }

            // Draw constraints
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3;
            constraints.forEach((constraint, index) => {
                ctx.beginPath();
                
                // Draw constraint line
                if (constraint.a2 !== 0) {
                    const x1Start = 0;
                    const x2Start = (constraint.b - constraint.a1 * x1Start) / constraint.a2;
                    const x1End = maxX;
                    const x2End = (constraint.b - constraint.a1 * x1End) / constraint.a2;
                    
                    ctx.moveTo(toScreenX(x1Start), toScreenY(x2Start));
                    ctx.lineTo(toScreenX(x1End), toScreenY(x2End));
                } else if (constraint.a1 !== 0) {
                    const x1 = constraint.b / constraint.a1;
                    ctx.moveTo(toScreenX(x1), margin);
                    ctx.lineTo(toScreenX(x1), height - margin);
                }
                ctx.stroke();

                // Smart label positioning to avoid overlap
                ctx.fillStyle = '#ef4444';
                ctx.font = 'bold 12px Arial';
                const labelX = Math.min(width - 150, toScreenX(maxX * 0.7));
                const labelY = Math.max(60, toScreenY(maxY * 0.9 - index * maxY * 0.12));
                
                // Format constraint text
                const a1Text = constraint.a1 === 1 ? '' : (constraint.a1 === -1 ? '-' : constraint.a1);
                const a2Text = constraint.a2 === 1 ? '' : (constraint.a2 === -1 ? '-' : Math.abs(constraint.a2));
                const sign2 = constraint.a2 >= 0 ? '+' : '';
                const bText = constraint.b >= 1000 ? (constraint.b / 1000).toFixed(1) + 'k' : constraint.b;
                
                ctx.fillText(`${a1Text}x₁ ${sign2}${a2Text}x₂ ${constraint.sign} ${bText}`, 
                           labelX, labelY);
            });

            // Shade feasible region
            if (solution.cornerPoints && solution.cornerPoints.length > 0) {
                ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
                ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                
                // Sort points by angle to create proper polygon
                const center = solution.cornerPoints.reduce((acc, point) => 
                    [acc[0] + point[0] / solution.cornerPoints.length, 
                     acc[1] + point[1] / solution.cornerPoints.length], [0, 0]);
                
                const sortedPoints = solution.cornerPoints.sort((a, b) => 
                    Math.atan2(a[1] - center[1], a[0] - center[0]) - 
                    Math.atan2(b[1] - center[1], b[0] - center[0]));

                const firstPoint = sortedPoints[0];
                ctx.moveTo(toScreenX(firstPoint[0]), toScreenY(firstPoint[1]));
                
                sortedPoints.forEach(point => {
                    ctx.lineTo(toScreenX(point[0]), toScreenY(point[1]));
                });
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }

            // Draw corner points with better visibility
            if (solution.cornerPoints) {
                solution.cornerPoints.forEach(point => {
                    // Outer ring
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.arc(toScreenX(point[0]), toScreenY(point[1]), 6, 0, 2 * Math.PI);
                    ctx.fill();
                    
                    // Inner circle
                    ctx.fillStyle = '#22c55e';
                    ctx.beginPath();
                    ctx.arc(toScreenX(point[0]), toScreenY(point[1]), 4, 0, 2 * Math.PI);
                    ctx.fill();
                });
            }

            // Draw optimal point with enhanced visibility
            if (solution.optimalPoint) {
                // Outer glow
                ctx.fillStyle = 'rgba(234, 179, 8, 0.3)';
                ctx.beginPath();
                ctx.arc(toScreenX(solution.optimalPoint[0]), toScreenY(solution.optimalPoint[1]), 12, 0, 2 * Math.PI);
                ctx.fill();
                
                // White ring
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(toScreenX(solution.optimalPoint[0]), toScreenY(solution.optimalPoint[1]), 8, 0, 2 * Math.PI);
                ctx.fill();
                
                // Inner circle
                ctx.fillStyle = '#eab308';
                ctx.beginPath();
                ctx.arc(toScreenX(solution.optimalPoint[0]), toScreenY(solution.optimalPoint[1]), 6, 0, 2 * Math.PI);
                ctx.fill();
                
                // Smart label positioning for optimal point
                ctx.fillStyle = '#374151';
                ctx.font = 'bold 13px Arial';
                const optX = solution.optimalPoint[0];
                const optY = solution.optimalPoint[1];
                
                // Format coordinates for display
                const xLabel = optX >= 1000 ? (optX / 1000).toFixed(2) + 'k' : optX.toFixed(2);
                const yLabel = optY >= 1000 ? (optY / 1000).toFixed(2) + 'k' : optY.toFixed(2);
                const labelText = `(${xLabel}, ${yLabel})`;
                
                const textWidth = ctx.measureText(labelText).width;
                const labelPosX = toScreenX(optX) + 15;
                const labelPosY = toScreenY(optY) - 15;
                
                // Background for label
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fillRect(labelPosX - 5, labelPosY - 15, textWidth + 10, 20);
                ctx.strokeStyle = '#eab308';
                ctx.lineWidth = 1;
                ctx.strokeRect(labelPosX - 5, labelPosY - 15, textWidth + 10, 20);
                
                ctx.fillStyle = '#374151';
                ctx.fillText(labelText, labelPosX, labelPosY);
            }

            // Draw objective function line (isocost/isoprofit) with better styling
            if (solution.optimalPoint && (c1 !== 0 || c2 !== 0)) {
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 3;
                ctx.setLineDash([8, 4]);
                
                const optimalValue = solution.optimalValue;
                ctx.beginPath();
                
                if (c2 !== 0) {
                    const x1Start = 0;
                    const x2Start = (optimalValue - c1 * x1Start) / c2;
                    const x1End = maxX;
                    const x2End = (optimalValue - c1 * x1End) / c2;
                    
                    ctx.moveTo(toScreenX(x1Start), toScreenY(x2Start));
                    ctx.lineTo(toScreenX(x1End), toScreenY(x2End));
                } else if (c1 !== 0) {
                    const x1 = optimalValue / c1;
                    ctx.moveTo(toScreenX(x1), margin);
                    ctx.lineTo(toScreenX(x1), height - margin);
                }
                ctx.stroke();
                ctx.setLineDash([]);
                
                // Label for objective function
                ctx.fillStyle = '#3b82f6';
                ctx.font = 'bold 12px Arial';
                const zValue = optimalValue >= 1000 ? (optimalValue / 1000).toFixed(1) + 'k' : optimalValue.toFixed(1);
                ctx.fillText(`Z = ${zValue}`, margin + 10, margin + 20);
            }
        }

        // Matrix Operations Functions
        function generateMatrices() {
            const rowsA = parseInt(document.getElementById('rows-a').value);
            const colsA = parseInt(document.getElementById('cols-a').value);
            const rowsB = parseInt(document.getElementById('rows-b').value);
            const colsB = parseInt(document.getElementById('cols-b').value);

            generateMatrix('matrix-a-container', rowsA, colsA, 'a');
            generateMatrix('matrix-b-container', rowsB, colsB, 'b');
        }

        function generateMatrix(containerId, rows, cols, prefix) {
            const container = document.getElementById(containerId);
            container.innerHTML = '';

            const table = document.createElement('table');
            table.className = 'mx-auto';

            for (let i = 0; i < rows; i++) {
                const row = document.createElement('tr');
                for (let j = 0; j < cols; j++) {
                    const cell = document.createElement('td');
                    cell.className = 'p-1';
                    const input = document.createElement('input');
                    input.type = 'number';
                    input.className = 'matrix-input';
                    input.id = `${prefix}${i}${j}`;
                    input.value = Math.floor(Math.random() * 10) - 5; // Random values -5 to 4
                    cell.appendChild(input);
                    row.appendChild(cell);
                }
                table.appendChild(row);
            }

            container.appendChild(table);
        }

        function getMatrix(prefix, rows, cols) {
            const matrix = [];
            for (let i = 0; i < rows; i++) {
                const row = [];
                for (let j = 0; j < cols; j++) {
                    const value = parseFloat(document.getElementById(`${prefix}${i}${j}`).value) || 0;
                    row.push(value);
                }
                matrix.push(row);
            }
            return matrix;
        }

        function displayMatrix(matrix, containerId, title) {
            const container = document.getElementById(containerId);
            container.innerHTML = `
                <div class="text-center mb-6">
                    <h4 class="text-2xl font-bold text-gray-800 mb-2">${title}</h4>
                    <div class="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
                </div>
            `;

            const wrapper = document.createElement('div');
            wrapper.className = 'bg-white p-6 rounded-xl shadow-lg border border-gray-200';

            const table = document.createElement('table');
            table.className = 'mx-auto border-collapse';

            matrix.forEach((row, i) => {
                const tr = document.createElement('tr');
                row.forEach((value, j) => {
                    const td = document.createElement('td');
                    td.className = 'border-2 border-gray-300 p-3 text-center min-w-20 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 font-semibold';
                    td.textContent = typeof value === 'number' ? value.toFixed(3) : value;
                    
                    // Add special styling for first row/column
                    if (i === 0) td.classList.add('bg-gradient-to-br', 'from-blue-100', 'to-indigo-100');
                    if (j === 0) td.classList.add('bg-gradient-to-br', 'from-green-100', 'to-teal-100');
                    
                    tr.appendChild(td);
                });
                table.appendChild(tr);
            });

            wrapper.appendChild(table);
            container.appendChild(wrapper);
        }

        function matrixOperation(operation) {
            try {
                const rowsA = parseInt(document.getElementById('rows-a').value);
                const colsA = parseInt(document.getElementById('cols-a').value);
                const rowsB = parseInt(document.getElementById('rows-b').value);
                const colsB = parseInt(document.getElementById('cols-b').value);

                const matrixA = getMatrix('a', rowsA, colsA);
                const matrixB = getMatrix('b', rowsB, colsB);

                let result, title;

                switch (operation) {
                    case 'add':
                        if (rowsA !== rowsB || colsA !== colsB) {
                            throw new Error('Las matrices deben tener las mismas dimensiones para sumar');
                        }
                        result = addMatrices(matrixA, matrixB);
                        title = 'A + B';
                        break;

                    case 'subtract':
                        if (rowsA !== rowsB || colsA !== colsB) {
                            throw new Error('Las matrices deben tener las mismas dimensiones para restar');
                        }
                        result = subtractMatrices(matrixA, matrixB);
                        title = 'A - B';
                        break;

                    case 'multiply':
                        if (colsA !== rowsB) {
                            throw new Error('El número de columnas de A debe igual al número de filas de B');
                        }
                        result = multiplyMatrices(matrixA, matrixB);
                        title = 'A × B';
                        break;

                    case 'transpose-a':
                        result = transposeMatrix(matrixA);
                        title = 'Aᵀ (Transpuesta de A)';
                        break;

                    case 'determinant-a':
                        if (rowsA !== colsA) {
                            throw new Error('La matriz debe ser cuadrada para calcular el determinante');
                        }
                        const det = determinant(matrixA);
                        document.getElementById('matrix-result-container').innerHTML = 
                            `<div class="text-center"><h4 class="font-semibold mb-2">Determinante de A</h4><div class="text-2xl font-bold">${det.toFixed(6)}</div></div>`;
                        return;

                    case 'inverse-a':
                        if (rowsA !== colsA) {
                            throw new Error('La matriz debe ser cuadrada para calcular la inversa');                        }
                        const det_a = determinant(matrixA);
                        if (Math.abs(det_a) < 1e-10) {
                            throw new Error('La matriz no es invertible (determinante = 0)');
                        }
                        result = inverseMatrix(matrixA);
                        title = 'A⁻¹ (Inversa de A)';
                        break;

                    default:
                        throw new Error('Operación no reconocida');
                }

                displayMatrix(result, 'matrix-result-container', title);

            } catch (error) {
                document.getElementById('matrix-result-container').innerHTML = 
                    `<div class="text-red-600 text-center"><h4 class="font-semibold mb-2">Error</h4><p>${error.message}</p></div>`;
            }
        }

        // Matrix operation implementations
        function addMatrices(A, B) {
            return A.map((row, i) => row.map((val, j) => val + B[i][j]));
        }

        function subtractMatrices(A, B) {
            return A.map((row, i) => row.map((val, j) => val - B[i][j]));
        }

        function multiplyMatrices(A, B) {
            const result = [];
            for (let i = 0; i < A.length; i++) {
                result[i] = [];
                for (let j = 0; j < B[0].length; j++) {
                    let sum = 0;
                    for (let k = 0; k < B.length; k++) {
                        sum += A[i][k] * B[k][j];
                    }
                    result[i][j] = sum;
                }
            }
            return result;
        }

        function transposeMatrix(A) {
            return A[0].map((_, i) => A.map(row => row[i]));
        }

        function determinant(matrix) {
            const n = matrix.length;
            if (n === 1) return matrix[0][0];
            if (n === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

            let det = 0;
            for (let i = 0; i < n; i++) {
                const submatrix = matrix.slice(1).map(row => 
                    row.filter((_, j) => j !== i)
                );
                det += Math.pow(-1, i) * matrix[0][i] * determinant(submatrix);
            }
            return det;
        }

        function inverseMatrix(matrix) {
            const n = matrix.length;
            const augmented = matrix.map((row, i) => [
                ...row,
                ...Array(n).fill(0).map((_, j) => i === j ? 1 : 0)
            ]);

            // Gauss-Jordan elimination
            for (let i = 0; i < n; i++) {
                // Find pivot
                let maxRow = i;
                for (let k = i + 1; k < n; k++) {
                    if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
                        maxRow = k;
                    }
                }
                [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

                // Make diagonal 1
                const pivot = augmented[i][i];
                for (let j = 0; j < 2 * n; j++) {
                    augmented[i][j] /= pivot;
                }

                // Eliminate column
                for (let k = 0; k < n; k++) {
                    if (k !== i) {
                        const factor = augmented[k][i];
                        for (let j = 0; j < 2 * n; j++) {
                            augmented[k][j] -= factor * augmented[i][j];
                        }
                    }
                }
            }

            // Extract inverse matrix
            return augmented.map(row => row.slice(n));
        }