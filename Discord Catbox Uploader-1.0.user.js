// ==UserScript==
// @name        Discord Catbox Uploader
// @namespace   https://tampermonkey.net/
// @version     1.5
// @description adds a button to upload files to catbox.moe, output gets copied to your clipboard. version 1.5: you can now add your userhash for catbox by right clicking the button
// @author      OasisVee
// @match       https://*.discord.com/*
// @grant       GM_xmlhttpRequest
// @grant       GM_setClipboard
// @grant       GM_addStyle
// @grant       GM_getValue
// @grant       GM_setValue
// @connect     catbox.moe
// @icon        https://www.google.com/s2/favicons?sz=64&domain=catbox.moe
// @license     MIT
// @downloadURL https://update.greasyfork.org/scripts/510832/Discord%20Catbox%20Uploader.user.js
// @updateURL   https://update.greasyfork.org/scripts/510832/Discord%20Catbox%20Uploader.meta.js
// ==/UserScript==

(function() {
    'use strict';

    const STYLES = `
        .catbox-tooltip {
            position: absolute;
            background-color: #202225;
            color: #dcddde;
            padding: 8px 12px;
            border-radius: 5px;
            font-size: 14px;
            font-weight: 500;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.1s ease-in-out;
            z-index: 9999;
            top: -30px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            white-space: nowrap;
            border: 1px solid #36393F;
        }
        .catbox-tooltip::before {
            content: '';
            position: absolute;
            width: 0;
            height: 0;
            border: 8px solid transparent;
            border-top-color: #202225;
            bottom: -16px;
            left: 50%;
            transform: translateX(-50%);
        }
        #catbox-settings {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #36393f;
            padding: 20px;
            border-radius: 5px;
            z-index: 10000;
            display: none;
        }
        #catbox-settings input {
            width: 100%;
            margin-bottom: 10px;
            padding: 5px;
            background-color: #40444b;
            border: none;
            color: #dcddde;
        }
        #catbox-settings button {
            background-color: #5865f2;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
        }
    `;

    const CAT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12,8L10.67,8.09C9.81,7.07 7.4,4.5 5,4.5C5,4.5 3.03,7.46 4.96,11.41C4.41,12.24 4.07,12.67 4,13.66L2.07,18.37L2.06,18.39C1.61,19.31 2.08,20.68 3,21.13L3.09,21.17C3.42,21.31 3.77,21.35 4.09,21.3C4.39,21.33 4.7,21.27 4.95,21.13L5.36,20.94C6.35,20.44 6.69,20.18 7.12,20.03C7.88,19.83 8.88,19.9 10.01,19.9H14C15.15,19.9 16.15,19.83 16.91,20.03C17.34,20.18 17.66,20.44 18.65,20.94L19.06,21.13C19.3,21.27 19.61,21.33 19.91,21.3C20.23,21.35 20.58,21.31 20.91,21.17L21,21.13C21.92,20.68 22.39,19.31 21.94,18.39L21.93,18.37L20,13.66C19.93,12.67 19.59,12.24 19.04,11.41C20.97,7.46 19,4.5 19,4.5C16.6,4.5 14.19,7.07 13.33,8.09L12,8M9,11A1,1 0 0,1 10,12A1,1 0 0,1 9,13A1,1 0 0,1 8,12A1,1 0 0,1 9,11M15,11A1,1 0 0,1 16,12A1,1 0 0,1 15,13A1,1 0 0,1 14,12A1,1 0 0,1 15,11M11,14H13L12.3,15.39C12.5,16.03 13.06,16.5 13.75,16.5A1.5,1.5 0 0,0 15.25,15H15.75A2,2 0 0,1 13.75,17C13,17 12.35,16.59 12,16V16H12C11.65,16.59 11,17 10.25,17A2,2 0 0,1 8.25,15H8.75A1.5,1.5 0 0,0 10.25,16.5C10.94,16.5 11.5,16.03 11.7,15.39L11,14Z"/></svg>`;

    const catboxButtonTemplate = document.createElement('button');
    catboxButtonTemplate.id = 'catbox-upload-btn';
    catboxButtonTemplate.innerHTML = CAT_SVG;
    catboxButtonTemplate.setAttribute('data-tooltip', 'Upload to Catbox');

    const fileInput = document.createElement('input');
    fileInput.type = 'file';

    const tooltipElement = document.createElement('div');
    tooltipElement.className = 'catbox-tooltip';

    const notificationElement = document.createElement('div');
    notificationElement.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 10px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
    `;

    function addCatboxButton() {
        const uploadButton = document.querySelector('button.attachButton_f298d4.attachButton_d0696b');
        if (uploadButton && !document.getElementById('catbox-upload-btn')) {
            const catboxButton = catboxButtonTemplate.cloneNode(true);
            catboxButton.className = uploadButton.className;
            catboxButton.style.cssText = `
                vertical-align: top;
                padding: 0px 8px;
                height: 0px;
                line-height: 0px;
                top: -20px;
                margin-left: 23px;
                position: relative;
                transform: translateX(0px);
                color: white;
                opacity: 80%;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            catboxButton.addEventListener('click', handleCatboxUpload);
            catboxButton.addEventListener('mouseenter', showTooltip);
            catboxButton.addEventListener('mouseleave', hideTooltip);
            catboxButton.addEventListener('contextmenu', toggleSettings);
            uploadButton.parentNode.insertBefore(catboxButton, uploadButton.nextSibling);
            return true;
        }
        return false;
    }

    function showTooltip(event) {
        const button = event.currentTarget;
        tooltipElement.textContent = button.getAttribute('data-tooltip');
        document.body.appendChild(tooltipElement);
        const buttonRect = button.getBoundingClientRect();
        const tooltipRect = tooltipElement.getBoundingClientRect();
        tooltipElement.style.left = `${buttonRect.left + (buttonRect.width / 2) - (tooltipRect.width / 2)}px`;
        tooltipElement.style.top = `${buttonRect.top - tooltipRect.height - 15}px`;
        requestAnimationFrame(() => tooltipElement.style.opacity = '1');
    }

    function hideTooltip() {
        tooltipElement.style.opacity = '0';
        setTimeout(() => {
            if (tooltipElement.parentNode) {
                tooltipElement.parentNode.removeChild(tooltipElement);
            }
        }, 100);
    }

    function handleCatboxUpload(event) {
        event.preventDefault();
        event.stopPropagation();
        fileInput.click();
    }

    function uploadFile(file) {
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', file);

        const userHash = GM_getValue('catboxUserHash', '');
        if (userHash) {
            formData.append('userhash', userHash);
        }

        GM_xmlhttpRequest({
            method: 'POST',
            url: 'https://catbox.moe/user/api.php',
            data: formData,
            onload: handleUploadResponse,
            onerror: () => showNotification('Error uploading to Catbox.moe. Please try again.', 'error')
        });
    }

    function handleUploadResponse(response) {
        if (response.status === 200) {
            GM_setClipboard(response.responseText);
            showNotification('File uploaded and link copied to clipboard!', 'success');
        } else {
            showNotification('Error uploading to Catbox.moe. Please try again.', 'error');
        }
    }

    function showNotification(message, type) {
        notificationElement.textContent = message;
        notificationElement.style.backgroundColor = type === 'error' ? '#ff4444' : '#00C851';
        document.body.appendChild(notificationElement);
        requestAnimationFrame(() => {
            notificationElement.style.opacity = '1';
            setTimeout(() => {
                notificationElement.style.opacity = '0';
                setTimeout(() => document.body.removeChild(notificationElement), 300);
            }, 3000);
        });
    }

    function toggleSettings(event) {
        event.preventDefault();
        const existingSettings = document.getElementById('catbox-settings');
        if (existingSettings) {
            existingSettings.remove();
            return;
        }

        const settingsDiv = document.createElement('div');
        settingsDiv.id = 'catbox-settings';
        settingsDiv.innerHTML = `
            <input type="text" id="catbox-user-hash" placeholder="Enter Catbox User Hash">
            <button id="save-catbox-settings">Save</button>
        `;
        document.body.appendChild(settingsDiv);
        const userHashInput = document.getElementById('catbox-user-hash');
        userHashInput.value = GM_getValue('catboxUserHash', '');
        document.getElementById('save-catbox-settings').addEventListener('click', saveSettings);
        settingsDiv.style.display = 'block';

        // Close settings when clicking outside
        document.addEventListener('click', closeSettingsOutside);
    }

    function closeSettingsOutside(event) {
        const settingsDiv = document.getElementById('catbox-settings');
        if (settingsDiv && !settingsDiv.contains(event.target) && event.target.id !== 'catbox-upload-btn') {
            settingsDiv.remove();
            document.removeEventListener('click', closeSettingsOutside);
        }
    }

    function saveSettings() {
        const userHash = document.getElementById('catbox-user-hash').value;
        GM_setValue('catboxUserHash', userHash);
        document.getElementById('catbox-settings').remove();
        showNotification('Catbox settings saved!', 'success');
        document.removeEventListener('click', closeSettingsOutside);
    }

    function init() {
        GM_addStyle(STYLES);
        const observer = new MutationObserver((mutations) => {
            if (mutations.some(mutation => mutation.addedNodes.length > 0)) {
                addCatboxButton();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        fileInput.addEventListener('change', event => {
            const file = event.target.files[0];
            if (file) uploadFile(file);
        });
        addCatboxButton();
    }

    init();
})();
