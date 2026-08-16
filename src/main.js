import './style.css'

// DOM Elements
const imageInput = document.getElementById('imageInput')
const uploadBox = document.getElementById('uploadBox')
const pixelSizeSlider = document.getElementById('pixelSize')
const pixelSizeValue = document.getElementById('pixelSizeValue')
const colorCountSlider = document.getElementById('colorCount')
const colorCountValue = document.getElementById('colorCountValue')
const outputSizeSlider = document.getElementById('outputSize')
const outputSizeValue = document.getElementById('outputSizeValue')
const gridLinesToggle = document.getElementById('gridLinesToggle')
const previewToolbar = document.getElementById('previewToolbar')
const editBtn = document.getElementById('editBtn')
const zoomOutBtn = document.getElementById('zoomOutBtn')
const zoomInBtn = document.getElementById('zoomInBtn')
const zoomValue = document.getElementById('zoomValue')
const canvas = document.getElementById('canvas')
const uploadBoxContent = document.getElementById('uploadBoxContent')
const downloadBtn = document.getElementById('downloadBtn')
const resetBtn = document.getElementById('resetBtn')
const controlsSection = document.getElementById('controlsSection')
const canvasSection = document.getElementById('canvasSection')
const buttonsSection = document.getElementById('buttonsSection')

let originalImage = null
let currentPixelSize = 15
let currentColorCount = 30
let currentOutputSize = 100
let showGridLines = false
const gridLineThickness = 2
const gridLineOpacity = 10
let currentPixelatedCanvas = null
let initialPixelatedCanvas = null
let isEditMode = false
let selectedCell = null
let previewZoom = 1
const minZoom = 1
const maxZoom = 4
const paletteColors = [
  '#000000', '#ffffff', '#ff0000', '#ff7f00', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#7f00ff', '#ff00ff',
  '#808080', '#c0c0c0', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#4d4d4d', '#d9d9d9',
  '#ffb3b3', '#ffd9b3', '#ffffb3', '#b3ffb3', '#b3ffff', '#b3b3ff', '#ffb3ff', '#bfa58a', '#d4a373', '#8b4513'
]

const colorPaletteModal = document.createElement('div')
colorPaletteModal.className = 'color-palette-modal'
colorPaletteModal.innerHTML = `
  <div class="color-palette-panel">
    <div class="color-palette-header">
      <span>色を選択</span>
      <div class="color-palette-actions">
        <button type="button" class="palette-revert hidden">戻す</button>
        <button type="button" class="palette-cancel">キャンセル</button>
      </div>
    </div>
    <div class="color-palette-grid"></div>
  </div>
`
const colorPaletteGrid = colorPaletteModal.querySelector('.color-palette-grid')
const paletteRevertBtn = colorPaletteModal.querySelector('.palette-revert')
const paletteCancelBtn = colorPaletteModal.querySelector('.palette-cancel')

document.body.appendChild(colorPaletteModal)

paletteRevertBtn.addEventListener('click', () => {
  if (selectedCell && currentPixelatedCanvas) {
    restoreOriginalCellColor()
  }
  closeColorPalette()
})

paletteCancelBtn.addEventListener('click', () => {
  if (selectedCell && currentPixelatedCanvas) {
    restoreOriginalCellColor()
  }
  closeColorPalette()
})

function renderPaletteColors() {
  colorPaletteGrid.innerHTML = ''
  paletteColors.forEach((color) => {
    const swatch = document.createElement('button')
    swatch.type = 'button'
    swatch.className = 'color-swatch'
    swatch.style.backgroundColor = color
    swatch.title = color
    swatch.setAttribute('aria-label', `色 ${color} を選択`)
    swatch.addEventListener('click', () => applySelectedColor(color))
    colorPaletteGrid.appendChild(swatch)
  })
}

renderPaletteColors()

function initializeControls() {
  pixelSizeSlider.value = currentPixelSize
  pixelSizeValue.textContent = currentPixelSize
  colorCountSlider.value = currentColorCount
  colorCountValue.textContent = currentColorCount
  outputSizeSlider.value = currentOutputSize
  outputSizeValue.textContent = currentOutputSize
  gridLinesToggle.checked = showGridLines
  previewZoom = 1
  updateZoomUI()

  controlsSection.style.display = 'flex'
  canvasSection.style.display = 'none'
  buttonsSection.style.display = 'none'
}

// Event Listeners
imageInput.addEventListener('change', handleImageSelect)
uploadBox.addEventListener('dragover', handleDragOver)
uploadBox.addEventListener('dragleave', handleDragLeave)
uploadBox.addEventListener('drop', handleDrop)
pixelSizeSlider.addEventListener('input', handlePixelSizeChange)
colorCountSlider.addEventListener('input', handleColorCountChange)
outputSizeSlider.addEventListener('input', handleOutputSizeChange)
gridLinesToggle.addEventListener('change', handleGridLinesChange)
editBtn.addEventListener('click', toggleGridEditing)
zoomOutBtn.addEventListener('click', () => updateZoom(-0.25))
zoomInBtn.addEventListener('click', () => updateZoom(0.25))
downloadBtn.addEventListener('click', downloadImage)
resetBtn.addEventListener('click', resetApp)

initializeControls()

function handleDragOver(e) {
  e.preventDefault()
  uploadBox.classList.add('drag-over')
}

function handleDragLeave(e) {
  e.preventDefault()
  uploadBox.classList.remove('drag-over')
}

function handleDrop(e) {
  e.preventDefault()
  uploadBox.classList.remove('drag-over')
  
  const files = e.dataTransfer.files
  if (files.length > 0) {
    imageInput.files = files
    handleImageSelect()
  }
}

function handleImageSelect() {
  const file = imageInput.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      originalImage = img
      showControls()
      convertToPixelArt()
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file)
}

function handlePixelSizeChange(e) {
  currentPixelSize = parseInt(e.target.value)
  pixelSizeValue.textContent = currentPixelSize
  if (originalImage) {
    convertToPixelArt()
  }
}

function handleColorCountChange(e) {
  currentColorCount = parseInt(e.target.value)
  colorCountValue.textContent = currentColorCount
  if (originalImage) {
    convertToPixelArt()
  }
}

function handleOutputSizeChange(e) {
  currentOutputSize = parseInt(e.target.value)
  outputSizeValue.textContent = currentOutputSize
}

function handleGridLinesChange(e) {
  showGridLines = e.target.checked
  if (originalImage) {
    convertToPixelArt()
  }
}

function toggleGridEditing() {
  isEditMode = !isEditMode
  editBtn.classList.toggle('active', isEditMode)
  if (isEditMode) {
    showGridLines = true
    gridLinesToggle.checked = true
    redrawCanvasFromPixelated()
  } else {
    showGridLines = false
    gridLinesToggle.checked = false
    redrawCanvasFromPixelated()
  }
}

function showControls() {
  controlsSection.style.display = 'flex'
  uploadBoxContent.style.display = 'none'
  uploadBox.classList.add('preview-mode')
  uploadBox.appendChild(canvas)
  previewToolbar.style.display = 'flex'
  editBtn.style.display = 'flex'
  canvasSection.style.display = 'none'
  buttonsSection.style.display = 'flex'
  canvas.addEventListener('click', handleCanvasCellClick)
  updateZoomUI()
}

function handleCanvasCellClick(event) {
  if (!isEditMode || !currentPixelatedCanvas) return

  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const pixelX = Math.min(currentPixelatedCanvas.width - 1, Math.max(0, Math.floor((x / rect.width) * currentPixelatedCanvas.width)))
  const pixelY = Math.min(currentPixelatedCanvas.height - 1, Math.max(0, Math.floor((y / rect.height) * currentPixelatedCanvas.height)))
  const imageData = currentPixelatedCanvas.getContext('2d').getImageData(0, 0, currentPixelatedCanvas.width, currentPixelatedCanvas.height)
  const index = (pixelY * currentPixelatedCanvas.width + pixelX) * 4
  selectedCell = {
    x: pixelX,
    y: pixelY,
    index,
    originalColor: [
      imageData.data[index],
      imageData.data[index + 1],
      imageData.data[index + 2],
      imageData.data[index + 3]
    ]
  }

  openColorPalette()
}

function isSelectedCellEdited() {
  if (!selectedCell || !currentPixelatedCanvas || !initialPixelatedCanvas) return false

  const currentCtx = currentPixelatedCanvas.getContext('2d')
  const currentImageData = currentCtx.getImageData(0, 0, currentPixelatedCanvas.width, currentPixelatedCanvas.height)
  const initialCtx = initialPixelatedCanvas.getContext('2d')
  const initialImageData = initialCtx.getImageData(0, 0, initialPixelatedCanvas.width, initialPixelatedCanvas.height)
  
  const currentR = currentImageData.data[selectedCell.index]
  const currentG = currentImageData.data[selectedCell.index + 1]
  const currentB = currentImageData.data[selectedCell.index + 2]
  const currentA = currentImageData.data[selectedCell.index + 3]
  
  const initialR = initialImageData.data[selectedCell.index]
  const initialG = initialImageData.data[selectedCell.index + 1]
  const initialB = initialImageData.data[selectedCell.index + 2]
  const initialA = initialImageData.data[selectedCell.index + 3]

  return currentR !== initialR || currentG !== initialG || currentB !== initialB || currentA !== initialA
}

function syncPaletteButtons() {
  const shouldEnableRevert = isSelectedCellEdited()
  paletteRevertBtn.disabled = !shouldEnableRevert
}

function openColorPalette() {
  colorPaletteModal.classList.add('visible')
  syncPaletteButtons()
}

function closeColorPalette() {
  colorPaletteModal.classList.remove('visible')
  paletteRevertBtn.disabled = true
  selectedCell = null
}

function restoreOriginalCellColor() {
  if (!selectedCell || !currentPixelatedCanvas || !initialPixelatedCanvas) return

  const currentCtx = currentPixelatedCanvas.getContext('2d')
  const initialCtx = initialPixelatedCanvas.getContext('2d')
  const initialImageData = initialCtx.getImageData(0, 0, initialPixelatedCanvas.width, initialPixelatedCanvas.height)
  
  const currentImageData = currentCtx.getImageData(0, 0, currentPixelatedCanvas.width, currentPixelatedCanvas.height)
  const [r, g, b, a] = [
    initialImageData.data[selectedCell.index],
    initialImageData.data[selectedCell.index + 1],
    initialImageData.data[selectedCell.index + 2],
    initialImageData.data[selectedCell.index + 3]
  ]
  
  currentImageData.data[selectedCell.index] = r
  currentImageData.data[selectedCell.index + 1] = g
  currentImageData.data[selectedCell.index + 2] = b
  currentImageData.data[selectedCell.index + 3] = a
  currentCtx.putImageData(currentImageData, 0, 0)
  redrawCanvasFromPixelated()
}

function applySelectedColor(color) {
  if (!selectedCell || !currentPixelatedCanvas) return

  const ctx = currentPixelatedCanvas.getContext('2d')
  const imageData = ctx.getImageData(0, 0, currentPixelatedCanvas.width, currentPixelatedCanvas.height)
  const rgb = hexToRgb(color)
  imageData.data[selectedCell.index] = rgb.r
  imageData.data[selectedCell.index + 1] = rgb.g
  imageData.data[selectedCell.index + 2] = rgb.b
  imageData.data[selectedCell.index + 3] = 255
  ctx.putImageData(imageData, 0, 0)
  redrawCanvasFromPixelated()
  closeColorPalette()
}

function updateZoomUI() {
  zoomValue.textContent = `${Math.round(previewZoom * 100)}%`
  zoomOutBtn.disabled = previewZoom <= minZoom
  zoomInBtn.disabled = previewZoom >= maxZoom

  if (currentPixelatedCanvas) {
    const displayWidth = Math.round(currentPixelatedCanvas.width * currentPixelSize * (currentOutputSize / 100))
    const displayHeight = Math.round(currentPixelatedCanvas.height * currentPixelSize * (currentOutputSize / 100))
    canvas.style.width = `${displayWidth * previewZoom}px`
    canvas.style.height = `${displayHeight * previewZoom}px`
  }
}

function updateZoom(step) {
  previewZoom = Math.min(maxZoom, Math.max(minZoom, Number((previewZoom + step).toFixed(2))))
  updateZoomUI()
}

function redrawCanvasFromPixelated() {
  if (!currentPixelatedCanvas) return

  const displayWidth = Math.round(currentPixelatedCanvas.width * currentPixelSize * (currentOutputSize / 100))
  const displayHeight = Math.round(currentPixelatedCanvas.height * currentPixelSize * (currentOutputSize / 100))
  canvas.width = displayWidth
  canvas.height = displayHeight

  const mainCtx = canvas.getContext('2d')
  mainCtx.imageSmoothingEnabled = false
  mainCtx.clearRect(0, 0, displayWidth, displayHeight)
  mainCtx.drawImage(currentPixelatedCanvas, 0, 0, currentPixelatedCanvas.width, currentPixelatedCanvas.height, 0, 0, displayWidth, displayHeight)

  if (showGridLines) {
    drawGridLines(mainCtx, currentPixelatedCanvas.width, currentPixelatedCanvas.height, displayWidth, displayHeight)
  }

  updateZoomUI()
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized

  const num = Number.parseInt(value, 16)
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  }
}

function convertToPixelArt() {
  // Create temporary canvas for image processing
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')
  
  // Set canvas size to original image size
  tempCanvas.width = originalImage.width
  tempCanvas.height = originalImage.height
  
  // Draw original image
  tempCtx.drawImage(originalImage, 0, 0)
  
  // Get image data
  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
  const data = imageData.data
  
  // Reduce colors using k-means clustering
  const coloredData = reduceColors(data, currentColorCount)
  
  // Create pixelated version
  const pixelatedCanvas = document.createElement('canvas')
  const pixelWidth = Math.ceil(tempCanvas.width / currentPixelSize)
  const pixelHeight = Math.ceil(tempCanvas.height / currentPixelSize)
  
  pixelatedCanvas.width = pixelWidth
  pixelatedCanvas.height = pixelHeight
  
  const pixelCtx = pixelatedCanvas.getContext('2d')
  pixelCtx.imageSmoothingEnabled = false
  
  // Sample image data at pixel intervals and create pixelated version
  for (let y = 0; y < pixelHeight; y++) {
    for (let x = 0; x < pixelWidth; x++) {
      const sampleX = Math.floor((x * currentPixelSize + currentPixelSize / 2) % tempCanvas.width)
      const sampleY = Math.floor((y * currentPixelSize + currentPixelSize / 2) % tempCanvas.height)
      const index = (sampleY * tempCanvas.width + sampleX) * 4
      
      const r = coloredData[index]
      const g = coloredData[index + 1]
      const b = coloredData[index + 2]
      const a = coloredData[index + 3]
      
      pixelCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`
      pixelCtx.fillRect(x, y, 1, 1)
    }
  }
  
  // Display pixelated image on main canvas with output size scaling
  // 100% = pixelSize per dot, so each dot is currentPixelSize pixels
  const displayWidth = Math.round(pixelatedCanvas.width * currentPixelSize * (currentOutputSize / 100))
  const displayHeight = Math.round(pixelatedCanvas.height * currentPixelSize * (currentOutputSize / 100))
  
  // Store the full-resolution pixelated canvas for download
  currentPixelatedCanvas = pixelatedCanvas
  
  // Create and store a copy of the initial pixelated canvas for editing operations
  initialPixelatedCanvas = document.createElement('canvas')
  initialPixelatedCanvas.width = pixelatedCanvas.width
  initialPixelatedCanvas.height = pixelatedCanvas.height
  const initCtx = initialPixelatedCanvas.getContext('2d')
  initCtx.drawImage(pixelatedCanvas, 0, 0)
  
  canvas.width = displayWidth
  canvas.height = displayHeight
  redrawCanvasFromPixelated()
}

function drawGridLines(ctx, pixelWidth, pixelHeight, displayWidth, displayHeight) {
  const cellWidth = displayWidth / pixelWidth
  const cellHeight = displayHeight / pixelHeight
  const maxThickness = Math.max(1, Math.min(gridLineThickness, Math.round(Math.min(cellWidth, cellHeight))))

  ctx.save()
  ctx.globalAlpha = gridLineOpacity / 100
  ctx.fillStyle = '#000000'

  for (let y = 0; y < pixelHeight; y++) {
    for (let x = 0; x < pixelWidth; x++) {
      const left = x * cellWidth
      const top = y * cellHeight

      ctx.fillRect(left, top, cellWidth, maxThickness)
      ctx.fillRect(left, top, maxThickness, cellHeight)

      if (x === pixelWidth - 1) {
        ctx.fillRect(left + cellWidth - maxThickness, top, maxThickness, cellHeight)
      }
      if (y === pixelHeight - 1) {
        ctx.fillRect(left, top + cellHeight - maxThickness, cellWidth, maxThickness)
      }
    }
  }

  ctx.restore()
}

function reduceColors(imageData, targetColors) {
  const colors = []
  const quantizedData = new Uint8ClampedArray(imageData.length)
  
  // Sample colors from the image
  for (let i = 0; i < imageData.length; i += 4) {
    if (Math.random() < 0.1) { // Sample 10% of pixels
      colors.push({
        r: imageData[i],
        g: imageData[i + 1],
        b: imageData[i + 2]
      })
    }
  }
  
  // Initialize centroids randomly
  const centroids = []
  for (let i = 0; i < Math.min(targetColors, colors.length); i++) {
    centroids.push(colors[Math.floor(Math.random() * colors.length)])
  }
  
  // K-means clustering (simple version)
  for (let iter = 0; iter < 5; iter++) {
    const clusters = Array.from({ length: centroids.length }, () => [])
    
    // Assign colors to nearest centroid
    for (const color of colors) {
      let minDist = Infinity
      let nearestCentroid = 0
      
      for (let c = 0; c < centroids.length; c++) {
        const dist = colorDistance(color, centroids[c])
        if (dist < minDist) {
          minDist = dist
          nearestCentroid = c
        }
      }
      
      clusters[nearestCentroid].push(color)
    }
    
    // Update centroids
    for (let c = 0; c < centroids.length; c++) {
      if (clusters[c].length > 0) {
        centroids[c] = {
          r: Math.round(clusters[c].reduce((sum, col) => sum + col.r, 0) / clusters[c].length),
          g: Math.round(clusters[c].reduce((sum, col) => sum + col.g, 0) / clusters[c].length),
          b: Math.round(clusters[c].reduce((sum, col) => sum + col.b, 0) / clusters[c].length)
        }
      }
    }
  }
  
  // Map original image to quantized colors
  for (let i = 0; i < imageData.length; i += 4) {
    const color = {
      r: imageData[i],
      g: imageData[i + 1],
      b: imageData[i + 2]
    }
    
    let minDist = Infinity
    let nearestCentroid = 0
    
    for (let c = 0; c < centroids.length; c++) {
      const dist = colorDistance(color, centroids[c])
      if (dist < minDist) {
        minDist = dist
        nearestCentroid = c
      }
    }
    
    quantizedData[i] = centroids[nearestCentroid].r
    quantizedData[i + 1] = centroids[nearestCentroid].g
    quantizedData[i + 2] = centroids[nearestCentroid].b
    quantizedData[i + 3] = imageData[i + 3]
  }
  
  return quantizedData
}

function colorDistance(c1, c2) {
  const dr = c1.r - c2.r
  const dg = c1.g - c2.g
  const db = c1.b - c2.b
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function downloadImage() {
  if (!currentPixelatedCanvas) return
  
  // Calculate the display size for download
  const displayWidth = Math.round(currentPixelatedCanvas.width * currentPixelSize * (currentOutputSize / 100))
  const displayHeight = Math.round(currentPixelatedCanvas.height * currentPixelSize * (currentOutputSize / 100))
  
  // Create a download canvas with the display size
  const downloadCanvas = document.createElement('canvas')
  downloadCanvas.width = displayWidth
  downloadCanvas.height = displayHeight
  
  const downloadCtx = downloadCanvas.getContext('2d')
  downloadCtx.imageSmoothingEnabled = false
  downloadCtx.drawImage(currentPixelatedCanvas, 0, 0, currentPixelatedCanvas.width, currentPixelatedCanvas.height, 0, 0, displayWidth, displayHeight)
  
  // Draw grid lines if enabled
  if (showGridLines) {
    drawGridLines(downloadCtx, currentPixelatedCanvas.width, currentPixelatedCanvas.height, displayWidth, displayHeight)
  }
  
  // Download as PNG to preserve transparency
  const link = document.createElement('a')
  link.href = downloadCanvas.toDataURL('image/png')
  link.download = 'pixel-art.png'
  link.click()
}

function resetApp() {
  imageInput.value = ''
  originalImage = null
  currentPixelatedCanvas = null
  currentPixelSize = 15
  currentColorCount = 30
  currentOutputSize = 100
  showGridLines = false
  previewZoom = 1

  uploadBox.classList.remove('preview-mode')
  uploadBoxContent.style.display = 'block'
  canvasSection.appendChild(canvas)
  previewToolbar.style.display = 'none'
  editBtn.style.display = 'none'
  editBtn.classList.remove('active')
  canvasSection.style.display = 'none'
  initializeControls()
  canvas.width = 0
  canvas.height = 0
  canvas.style.width = 'auto'
  canvas.style.height = 'auto'
  uploadBox.classList.remove('drag-over')
}
