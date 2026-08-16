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
let currentPixelatedCanvas = null

function initializeControls() {
  pixelSizeSlider.value = currentPixelSize
  pixelSizeValue.textContent = currentPixelSize
  colorCountSlider.value = currentColorCount
  colorCountValue.textContent = currentColorCount
  outputSizeSlider.value = currentOutputSize
  outputSizeValue.textContent = currentOutputSize

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
  if (originalImage) {
    convertToPixelArt()
  }
}

function showControls() {
  controlsSection.style.display = 'flex'
  uploadBoxContent.style.display = 'none'
  uploadBox.classList.add('preview-mode')
  uploadBox.appendChild(canvas)
  canvasSection.style.display = 'none'
  buttonsSection.style.display = 'flex'
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
  
  canvas.width = displayWidth
  canvas.height = displayHeight
  
  const mainCtx = canvas.getContext('2d')
  mainCtx.imageSmoothingEnabled = false
  mainCtx.drawImage(pixelatedCanvas, 0, 0, pixelatedCanvas.width, pixelatedCanvas.height, 0, 0, displayWidth, displayHeight)
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
  
  const link = document.createElement('a')
  link.href = currentPixelatedCanvas.toDataURL('image/jpeg', 0.95)
  link.download = 'pixel-art.jpg'
  link.click()
}

function resetApp() {
  imageInput.value = ''
  originalImage = null
  currentPixelatedCanvas = null
  currentPixelSize = 15
  currentColorCount = 30
  currentOutputSize = 100

  uploadBox.classList.remove('preview-mode')
  uploadBoxContent.style.display = 'block'
  canvasSection.appendChild(canvas)
  canvasSection.style.display = 'none'
  initializeControls()
  canvas.width = 0
  canvas.height = 0
  uploadBox.classList.remove('drag-over')
}
