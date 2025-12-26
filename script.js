document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. MOBILE NAVIGATION
    // ==========================================
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('header nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            menuToggle.textContent = nav.classList.contains('active') ? '✕' : '☰';
        });
        
        // Close menu when clicking a link
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                menuToggle.textContent = '☰';
            });
        });
    }

    // ==========================================
    // 2. SCROLL ANIMATIONS (IntersectionObserver)
    // ==========================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up').forEach(el => observer.observe(el));

    // ==========================================
    // 3. FAQ ACCORDION
    // ==========================================
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            
            // Close all others
            document.querySelectorAll('.faq-question').forEach(otherBtn => {
                otherBtn.setAttribute('aria-expanded', 'false');
                otherBtn.nextElementSibling.style.maxHeight = null;
            });

            // Toggle current
            if (!expanded) {
                btn.setAttribute('aria-expanded', 'true');
                const answer = btn.nextElementSibling;
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    // ==========================================
    // 4. MODALS
    // ==========================================
    const openModalButtons = document.querySelectorAll('[data-modal-target]');
    const closeModalButtons = document.querySelectorAll('[data-modal-close]');
    const modals = document.querySelectorAll('.modal');

    openModalButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = button.getAttribute('data-modal-target') + '-modal';
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.add('active');
        });
    });

    closeModalButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            modal.classList.remove('active');
        });
    });

    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // ==========================================
    // 5. PLAYGROUND & API LOGIC
    // ==========================================

    // DOM Elements
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const previewImage = document.getElementById('preview-image');
    const removeBtn = document.getElementById('remove-btn');
    const generateBtn = document.getElementById('generate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resultFinal = document.getElementById('result-final');
    const loadingState = document.getElementById('loading-state');
    const placeholderContent = document.getElementById('placeholder-content');
    const processStatus = document.getElementById('process-status');
    const downloadBtn = document.getElementById('download-btn');
    const uploadContent = document.querySelector('.upload-content');

    // Global State
    let currentUploadedUrl = null;

    // --- UTILITY FUNCTIONS ---

    // Generate nanoid for unique filename
    function generateNanoId(length = 21) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // UI Helper: Update status text and indicators
    function updateStatus(text) {
        if (processStatus) {
            processStatus.textContent = text;
            
            // Remove previous status classes
            processStatus.classList.remove('status-processing', 'status-success', 'status-error');

            // Add class based on state
            if (text.includes('PROCESSING') || text.includes('UPLOADING') || text.includes('QUEUED')) {
                processStatus.classList.add('status-processing');
            } else if (text === 'COMPLETE' || text === 'READY') {
                processStatus.classList.add('status-success');
            } else if (text === 'ERROR') {
                processStatus.classList.add('status-error');
            }
        }

        // Update upload panel status if it exists
        const statusEl = document.querySelector('.upload-panel .status-indicator');
        if (statusEl) {
            statusEl.textContent = text === 'AWAITING_INPUT' ? 'AWAITING_INPUT' : text;
            statusEl.classList.remove('status-success');
            
            if (text === 'READY') {
                statusEl.classList.add('status-success');
            }
        }
    }

    // UI Helper: Show loading state
    function showLoading() {
        if (loadingState) loadingState.classList.remove('hidden');
        if (placeholderContent) placeholderContent.classList.add('hidden');
        if (resultFinal) resultFinal.classList.add('hidden');
        const vid = document.getElementById('result-video');
        if (vid) vid.style.display = 'none';
        
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.textContent = 'PROCESSING...';
        }
    }

    // UI Helper: Hide loading state
    function hideLoading() {
        if (loadingState) loadingState.classList.add('hidden');
        if (generateBtn) {
            generateBtn.textContent = 'INITIATE TRANSFORMATION';
        }
    }

    // UI Helper: Show error
    function showError(message) {
        alert(message);
        console.error(message);
    }

    // UI Helper: Show preview image
    function showPreview(url) {
        if (previewImage) {
            previewImage.src = url;
            previewImage.classList.remove('hidden');
        }
        if (removeBtn) removeBtn.classList.remove('hidden');
        if (uploadContent) uploadContent.classList.add('hidden');
    }

    // UI Helper: Show result media (Image or Video)
    function showResultMedia(url) {
        const resultImg = document.getElementById('result-final');
        const container = resultImg ? resultImg.parentElement : document.querySelector('.result-area');
        
        if (!container) return;
        
        const isVideo = url.toLowerCase().match(/\.(mp4|webm)(\?.*)?$/i);
        
        if (isVideo) {
            // Hide image
            if (resultImg) {
                resultImg.classList.add('hidden');
                resultImg.style.display = 'none';
            }
            
            // Show/Create video
            let video = document.getElementById('result-video');
            if (!video) {
                video = document.createElement('video');
                video.id = 'result-video';
                video.controls = true;
                video.autoplay = true;
                video.loop = true;
                video.muted = true; // Auto-play requires muted often
                video.className = resultImg ? resultImg.className : 'w-full h-auto rounded-lg';
                // Ensure classList manipulation matches image
                video.classList.remove('hidden');
                video.style.maxWidth = '100%';
                container.appendChild(video);
            }
            video.src = url;
            video.style.display = 'block';
        } else {
            // Hide video
            const video = document.getElementById('result-video');
            if (video) video.style.display = 'none';
            
            // Show image
            if (resultImg) {
                resultImg.style.display = 'block';
                resultImg.classList.remove('hidden');
                resultImg.crossOrigin = 'anonymous';
                resultImg.src = url;
            }
        }
    }

    // UI Helper: Store download URL on button
    function showDownloadButton(url) {
        if (downloadBtn) {
            downloadBtn.dataset.url = url;
            downloadBtn.disabled = false;
        }
    }

    // Enable generate button after upload is complete
    function enableGenerateButton() {
        if (generateBtn) {
            generateBtn.disabled = false;
        }
    }

    // --- API FUNCTIONS ---

    // Upload file to CDN storage (called immediately when file is selected)
    async function uploadFile(file) {
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const uniqueId = generateNanoId();
        const fileName = 'media/' + uniqueId + '.' + fileExtension;
        
        // Step 1: Get signed URL from API
        const signedUrlResponse = await fetch(
            'https://interact-screw-basic-outcome.trycloudflare.com/media/get-upload-url?fileName=' + encodeURIComponent(fileName) + '&projectId=dressr',
            { method: 'GET' }
        );
        
        if (!signedUrlResponse.ok) {
            throw new Error('Failed to get signed URL: ' + signedUrlResponse.statusText);
        }
        
        const signedUrl = await signedUrlResponse.text();
        
        // Step 2: PUT file to signed URL
        const uploadResponse = await fetch(signedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });
        
        if (!uploadResponse.ok) {
            throw new Error('Failed to upload file: ' + uploadResponse.statusText);
        }
        
        // Step 3: Return download URL
        const downloadUrl = 'https://assets.dressr.ai/' + fileName;
        return downloadUrl;
    }

    // Submit generation job (Image or Video)
    async function submitImageGenJob(imageUrl) {
        // Configuration per instructions
        const isVideo = 'video-effects' === 'video-effects';
        const endpoint = isVideo ? 'https://api.chromastudio.ai/video-gen' : 'https://api.chromastudio.ai/image-gen';
        
        // Video-specific headers
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'sec-ch-ua-platform': '"Windows"',
            'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
            'sec-ch-ua-mobile': '?0'
        };

        // Construct payload based on type
        let body = {};
        if (isVideo) {
            body = {
                imageUrl: [imageUrl], // Video API expects array
                effectId: 'halloween',
                userId: 'DObRu1vyStbUynoQmTcHBlhs55z2',
                removeWatermark: true,
                model: 'video-effects',
                isPrivate: true
            };
        } else {
            body = {
                model: 'video-effects',
                toolType: 'video-effects',
                effectId: 'halloween',
                imageUrl: imageUrl, // Image API expects string
                userId: 'DObRu1vyStbUynoQmTcHBlhs55z2',
                removeWatermark: true,
                isPrivate: true
            };
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit job: ' + response.statusText);
        }
        
        const data = await response.json();
        return data;
    }

    // Poll job status until completed or failed
    const USER_ID = 'DObRu1vyStbUynoQmTcHBlhs55z2';
    const POLL_INTERVAL = 2000; // 2 seconds
    const MAX_POLLS = 60; // Max 2 minutes of polling

    async function pollJobStatus(jobId) {
        const isVideo = 'video-effects' === 'video-effects';
        const baseUrl = isVideo ? 'https://api.chromastudio.ai/video-gen' : 'https://api.chromastudio.ai/image-gen';
        let polls = 0;
        
        while (polls < MAX_POLLS) {
            const response = await fetch(
                `${baseUrl}/${USER_ID}/${jobId}/status`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json, text/plain, */*'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error('Failed to check status: ' + response.statusText);
            }
            
            const data = await response.json();
            
            if (data.status === 'completed') {
                return data;
            }
            
            if (data.status === 'failed' || data.status === 'error') {
                throw new Error(data.error || 'Job processing failed');
            }
            
            // Update UI with progress
            updateStatus('PROCESSING... (' + (polls + 1) + ')');
            
            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            polls++;
        }
        
        throw new Error('Job timed out after ' + MAX_POLLS + ' polls');
    }

    // --- EVENT HANDLERS ---

    // Handler when file is selected - uploads immediately
    async function handleFileSelect(file) {
        try {
            // Update UI for upload state
            if (removeBtn) removeBtn.classList.add('hidden'); // Hide remove until done
            if (generateBtn) generateBtn.disabled = true;
            
            updateStatus('UPLOADING...');
            
            // Show a local preview first if possible (optional UX improvement, but sticking to prompt logic primarily)
            // But we must upload to get the URL
            
            // Upload immediately when file is selected
            const uploadedUrl = await uploadFile(file);
            currentUploadedUrl = uploadedUrl;
            
            // Show the uploaded image preview
            showPreview(uploadedUrl);
            
            updateStatus('READY');
            
            // Enable the generate button
            enableGenerateButton();
            
        } catch (error) {
            updateStatus('ERROR');
            showError(error.message);
            // Reset state if upload fails
            if (removeBtn) removeBtn.click();
        }
    }

    // Handler when Generate button is clicked - submits job and polls for result
    async function handleGenerate() {
        if (!currentUploadedUrl) return;
        
        try {
            showLoading();
            updateStatus('SUBMITTING JOB...');
            
            // Step 1: Submit job to ChromaStudio API
            const jobData = await submitImageGenJob(currentUploadedUrl);
            
            updateStatus('JOB QUEUED...');
            
            // Step 2: Poll for completion
            const result = await pollJobStatus(jobData.jobId);
            
            // Step 3: Get the result URL from response
            const resultItem = Array.isArray(result.result) ? result.result[0] : result.result;
            // Handle different potential response shapes
            const resultUrl = resultItem?.mediaUrl || resultItem?.video || resultItem?.image;
            const thumbUrl = resultItem?.thumbnailUrl || resultItem?.thumbnail;
            
            if (!resultUrl) {
                console.error('Response:', result);
                throw new Error('No media URL in response');
            }
            
            // Step 4: Display result
            showResultMedia(resultUrl);
            
            updateStatus('COMPLETE');
            hideLoading();
            showDownloadButton(resultUrl);
            
        } catch (error) {
            hideLoading();
            updateStatus('ERROR');
            showError(error.message);
        }
    }

    // --- WIRING UP LISTENERS ---

    // File Input
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleFileSelect(file);
            }
        });
    }

    // Drag & Drop
    if (uploadZone) {
        uploadZone.addEventListener('click', () => fileInput.click());
        
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = 'var(--accent)';
            uploadZone.style.background = 'rgba(255,34,34,0.1)';
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.style.borderColor = '';
            uploadZone.style.background = '';
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '';
            uploadZone.style.background = '';
            const file = e.dataTransfer.files[0];
            if (file) {
                handleFileSelect(file);
            }
        });
    }

    // Generate Button
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerate);
    }

    // Reset/Remove Button
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentUploadedUrl = null;
            if (fileInput) fileInput.value = '';
            
            if (previewImage) {
                previewImage.src = '';
                previewImage.classList.add('hidden');
            }
            removeBtn.classList.add('hidden');
            if (uploadContent) uploadContent.classList.remove('hidden');
            
            if (generateBtn) generateBtn.disabled = true;
            updateStatus('AWAITING_INPUT');
        });
    }

    // Global Reset Button
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (removeBtn) removeBtn.click();
            
            // Hide results
            if (resultFinal) resultFinal.classList.add('hidden');
            const video = document.getElementById('result-video');
            if (video) video.style.display = 'none';
            
            if (placeholderContent) placeholderContent.classList.remove('hidden');
            if (loadingState) loadingState.classList.add('hidden');
            
            if (downloadBtn) {
                downloadBtn.disabled = true;
                downloadBtn.dataset.url = '';
            }
            
            updateStatus('AWAITING_INPUT');
        });
    }

    // DOWNLOAD BUTTON - Uses fetch + blob to FORCE download
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            const url = downloadBtn.dataset.url;
            if (!url) return;
            
            const originalText = downloadBtn.textContent;
            downloadBtn.textContent = 'Downloading...';
            downloadBtn.disabled = true;
            
            try {
                // Fetch the file as a blob - this FORCES download instead of opening
                const response = await fetch(url, {
                    mode: 'cors',
                    credentials: 'omit'
                });
                
                if (!response.ok) {
                    throw new Error('Failed to fetch file: ' + response.statusText);
                }
                
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                
                // Determine file extension from URL or content-type
                const contentType = response.headers.get('content-type') || '';
                let extension = 'jpg';
                if (contentType.includes('video') || url.match(/\.(mp4|webm)/i)) {
                    extension = 'mp4';
                } else if (contentType.includes('png') || url.match(/\.png/i)) {
                    extension = 'png';
                } else if (contentType.includes('webp') || url.match(/\.webp/i)) {
                    extension = 'webp';
                }
                
                // Create download link
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = 'halloween_result_' + generateNanoId(8) + '.' + extension;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Cleanup blob URL after a delay
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                
            } catch (err) {
                console.error('Download error:', err);
                
                // Fallback: Try canvas approach for images (works if CORS is configured)
                try {
                    const img = document.getElementById('result-final');
                    const isVisible = img && window.getComputedStyle(img).display !== 'none';
                    
                    if (isVisible && img.complete && img.naturalWidth > 0) {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        
                        canvas.toBlob((blob) => {
                            if (blob) {
                                const link = document.createElement('a');
                                link.href = URL.createObjectURL(blob);
                                link.download = 'result_' + generateNanoId(8) + '.png';
                                link.click();
                                setTimeout(() => URL.revokeObjectURL(link.href), 1000);
                            } else {
                                alert('Download failed. Right-click the image and select "Save image as..." to download.');
                            }
                        }, 'image/png');
                        return;
                    }
                } catch (canvasErr) {
                    console.error('Canvas fallback error:', canvasErr);
                }
                
                // Final fallback - open in new tab
                alert('Direct download failed. The file will open in a new tab.\nRight-click and select "Save as..." to download.');
                window.open(url, '_blank');
            } finally {
                downloadBtn.textContent = originalText;
                downloadBtn.disabled = false;
            }
        });
    }

});
