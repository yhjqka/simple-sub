function generateXrayUrl(event) {
    event.preventDefault(); // 阻止表单默认提交行为
    
    const form = event.target;
    const formData = new FormData(form);
    const inputString = formData.get("input");

    if (!inputString || inputString.trim() === '') {
        alert('请输入配置内容！');
        return;
    }

    const xrayUrl = `${window.location.origin}/api/combine?xrayUrl=${encodeURIComponent(`${window.location.origin}/?config=${encodeURIComponent(inputString)}`)}`;

    // 显示结果
    const resultDiv = document.getElementById('result');
    const urlOutput = document.getElementById('urlOutput');
    urlOutput.textContent = xrayUrl;
    resultDiv.style.display = 'block';
    
    // 添加复制按钮
    addCopyButton(urlOutput, xrayUrl);
    
    return xrayUrl;
}

function clearForm() {
    document.getElementById('input').value = '';
    document.getElementById('result').style.display = 'none';
    document.getElementById('shortResult').style.display = 'none';
    document.getElementById('apiResult').style.display = 'none';
}

// 添加复制按钮到指定元素
function addCopyButton(container, textToCopy) {
    // 检查是否已经存在复制按钮
    const existingBtn = container.querySelector('.copy-btn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    const copyBtn = document.createElement('button');
    copyBtn.textContent = '复制链接';
    copyBtn.className = 'copy-btn';
    copyBtn.style.cssText = 'background: #007bff; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; margin-top: 10px;';
    copyBtn.onclick = function() {
        navigator.clipboard.writeText(textToCopy).then(function() {
            copyBtn.textContent = '已复制！';
            copyBtn.style.background = '#4caf50';
            setTimeout(() => {
                copyBtn.textContent = '复制链接';
                copyBtn.style.background = '#007bff';
            }, 2000);
        }).catch(function() {
            alert('复制失败，请手动复制');
        });
    };
    
    container.appendChild(document.createElement('br'));
    container.appendChild(copyBtn);
}

// 生成短地址
async function generateShortUrl() {
    const resultDiv = document.getElementById('result');
    const urlOutput = document.getElementById('urlOutput');
    
    // 检查是否已经生成了 URL
    if (resultDiv.style.display === 'none' || !urlOutput.textContent) {
        alert('请先生成 Xray URL！');
        return;
    }
    
    const xrayUrl = urlOutput.textContent;
    const shortResultDiv = document.getElementById('shortResult');
    const shortUrlOutput = document.getElementById('shortUrlOutput');
    const shortUrlInfo = document.getElementById('shortUrlInfo');
    
    // 显示加载状态
    shortUrlOutput.innerHTML = '<div style="text-align: center; padding: 20px;">正在生成短地址...</div>';
    shortResultDiv.style.display = 'block';
    
    try {
        const response = await fetch('/api/shorten', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                xrayUrl: xrayUrl
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            shortUrlOutput.innerHTML = `<div style="color: red;">错误: ${data.error}</div>`;
            shortUrlInfo.innerHTML = '';
        } else if (data.success) {
            // 显示短地址
            shortUrlOutput.innerHTML = `<div style="font-family: monospace; font-size: 16px; color: #e91e63; font-weight: bold;">${data.shortUrl}</div>`;
            
            // 显示详细信息
            const createDate = new Date(data.createdAt).toLocaleString('zh-CN');
            shortUrlInfo.innerHTML = `
                <div style="margin-bottom: 5px;"><strong>短地址ID:</strong> ${data.shortId}</div>
                <div style="margin-bottom: 5px;"><strong>创建时间:</strong> ${createDate}</div>
                <div style="margin-bottom: 5px;"><strong>说明:</strong> 访问此短地址将自动跳转到解析结果</div>
                <div><strong>原URL长度:</strong> ${xrayUrl.length} 字符 → <strong>短地址长度:</strong> ${data.shortUrl.length} 字符 (节省 ${xrayUrl.length - data.shortUrl.length} 字符)</div>
            `;
            
            // 添加复制按钮
            const copyBtn = document.createElement('button');
            copyBtn.textContent = '复制短地址';
            copyBtn.style.cssText = 'background: #e91e63; color: white; padding: 5px 10px; border: none; border-radius: 3px; cursor: pointer; font-size: 12px; margin-top: 10px;';
            copyBtn.onclick = function() {
                navigator.clipboard.writeText(data.shortUrl).then(function() {
                    copyBtn.textContent = '已复制！';
                    copyBtn.style.background = '#4caf50';
                    setTimeout(() => {
                        copyBtn.textContent = '复制短地址';
                        copyBtn.style.background = '#e91e63';
                    }, 2000);
                }).catch(function() {
                    alert('复制失败，请手动复制');
                });
            };
            
            shortUrlOutput.appendChild(document.createElement('br'));
            shortUrlOutput.appendChild(copyBtn);
        }
    } catch (error) {
        shortUrlOutput.innerHTML = `<div style="color: red;">请求失败: ${error.message}</div>`;
        shortUrlInfo.innerHTML = '';
    }
}

// 测试 API 解析功能 (Debug模式)
async function testApiParse() {
    await testApiWithMode(true);
}

// 测试文本模式
async function testTextMode() {
    await testApiWithMode(false);
}

// 通用测试函数
async function testApiWithMode(debug) {
    const resultDiv = document.getElementById('result');
    const urlOutput = document.getElementById('urlOutput');
    
    // 检查是否已经生成了 URL
    if (resultDiv.style.display === 'none' || !urlOutput.textContent) {
        alert('请先生成 Xray URL！');
        return;
    }
    
    const xrayUrl = urlOutput.textContent;
    const apiResultDiv = document.getElementById('apiResult');
    const apiOutput = document.getElementById('apiOutput');
    
    // 显示加载状态
    const modeText = debug ? 'Debug模式' : '文本模式';
    apiOutput.innerHTML = `<div style="text-align: center; padding: 20px;">正在解析中... (${modeText})</div>`;
    apiResultDiv.style.display = 'block';
    
    try {
        // 构建查询参数
        const params = new URLSearchParams();
        params.append('xrayUrl', xrayUrl);
        if (debug !== undefined) params.append('debug', debug.toString());
        
        const response = await fetch(`/api/combine?${params.toString()}`, {
            method: 'GET'
        });
        
        if (debug === true) {
            // Debug模式：解析JSON响应
            const data = await response.json();
            
            if (data.error) {
                apiOutput.innerHTML = `<div style="color: red;">错误: ${data.error}</div>`;
            } else {
                // 格式化显示结果
                let html = '<div style="font-family: Arial, sans-serif;">';
                
                // 显示统计信息
                if (data.summary) {
                    html += '<div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">';
                    html += '<h4 style="margin: 0 0 10px 0; color: #1976d2;">📊 合并统计</h4>';
                    html += `<p style="margin: 5px 0;"><strong>总链接数:</strong> ${data.summary.totalLinks}</p>`;
                    
                    // 显示唯一名称数，如果有重名则显示重名个数和已处理标记
                    if (data.hasDuplicates && data.summary.duplicateCount > 0) {
                        html += `<p style="margin: 5px 0;"><strong>唯一名称数:</strong> ${data.summary.originalUniqueNames} → ${data.summary.uniqueNames} <span style="background: #ff9800; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-left: 5px;">已处理${data.summary.duplicateCount}个重名</span></p>`;
                    } else {
                        html += `<p style="margin: 5px 0;"><strong>唯一名称数:</strong> ${data.summary.uniqueNames}</p>`;
                    }
                    
                    html += `<p style="margin: 5px 0;"><strong>协议类型:</strong> ${data.summary.protocols.join(', ')}</p>`;
                    html += '</div>';
                }
                
                // 显示合并后的链接列表
                if (data.mergedLinks && data.mergedLinks.length > 0) {
                    html += '<div style="background: #f1f8e9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">';
                    const titleText = data.hasDuplicates ? '🔗 合并后的链接列表 (已处理重名)' : '🔗 合并后的链接列表';
                    html += `<h4 style="margin: 0 0 15px 0; color: #388e3c;">${titleText}</h4>`;
                    html += '<div style="max-height: 300px; overflow-y: auto; background: white; border-radius: 4px; padding: 10px;">';
                    
                    data.mergedLinks.forEach((link, index) => {
                        const protocolColor = {
                            'Hysteria2': '#ff6b6b',
                            'VMess': '#4ecdc4',
                            'VLESS': '#45b7d1',
                            'Trojan': '#96ceb4',
                            'Shadowsocks': '#feca57',
                            'ShadowsocksR': '#ff9ff3',
                            'HTTP': '#a4b0be'
                        }[link.protocol] || '#95a5a6';
                        
                        // 根据是否有重名设置不同的背景色
                        const backgroundColor = link.isDuplicate ? '#fff3e0' : '#fafafa';
                        const duplicateBadge = link.isDuplicate ? '<span style="background: #ff9800; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-left: 5px;">重名</span>' : '';
                        
                        html += `<div style="margin-bottom: 10px; padding: 10px; border-left: 4px solid ${protocolColor}; background: ${backgroundColor};">`;
                        html += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">`;
                        html += `<span style="font-weight: bold; color: ${protocolColor};">${link.protocol}${duplicateBadge}</span>`;
                        html += `<span style="font-size: 12px; color: #666;">#${index + 1}</span>`;
                        html += `</div>`;
                        html += `<div style="margin-bottom: 5px;"><strong>显示名称:</strong> ${link.displayName}</div>`;
                        html += `<div style="word-break: break-all; font-size: 12px; color: #555; background: #fff; padding: 5px; border-radius: 3px;">${link.original}</div>`;
                        html += `</div>`;
                    });
                    
                    html += '</div></div>';
                }
                
                // 显示原始解析结果
                html += '<div style="background: #fff3e0; padding: 15px; border-radius: 8px;">';
                html += '<h4 style="margin: 0 0 15px 0; color: #f57c00;">📋 原始解析结果</h4>';
                html += '<div style="background: white; border-radius: 4px; padding: 10px; max-height: 300px; overflow-y: auto;">';
                
                data.results.forEach((item, index) => {
                    html += `<div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">`;
                    html += `<div style="font-weight: bold; color: #333; margin-bottom: 8px;">=== 项目 ${index + 1} ===</div>`;
                    html += `<div style="margin-bottom: 5px;"><strong>类型:</strong> ${item.type}</div>`;
                    
                    if (item.type === 'subscribe') {
                        html += `<div style="margin-bottom: 5px;"><strong>订阅URL:</strong> ${item.url}</div>`;
                        html += `<div style="margin-bottom: 5px;"><strong>包含链接数:</strong> ${Array.isArray(item.data) ? item.data.length : 0}</div>`;
                        
                        // 显示订阅错误信息
                        if (item.error) {
                            html += `<div style="margin-bottom: 5px; color: #d32f2f; font-weight: bold;">⚠️ 错误: ${item.error}</div>`;
                        }
                        
                        if (Array.isArray(item.data) && item.data.length > 0) {
                            html += `<div><strong>链接列表:</strong></div>`;
                            html += `<div style="margin-left: 20px; max-height: 150px; overflow-y: auto;">`;
                            item.data.forEach((line, i) => {
                                html += `<div style="margin: 2px 0; font-size: 12px; word-break: break-all;">${i + 1}. ${line}</div>`;
                            });
                            html += `</div>`;
                        }
                    } else {
                        html += `<div style="word-break: break-all; font-size: 12px;">${item.content}</div>`;
                    }
                    html += `</div>`;
                });
                
                html += '</div></div></div>';
                apiOutput.innerHTML = html;
            }
        } else {
            // 文本模式：直接显示文本响应
            const textData = await response.text();
            let html = '<div style="font-family: Arial, sans-serif;">';
            html += `<div style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 20px;">`;
            html += `<h4 style="margin: 0 0 10px 0; color: #2e7d32;">📄 ${modeText}结果</h4>`;
            html += `<p style="margin: 5px 0; color: #666;">内容类型: 纯文本</p>`;
            html += `</div>`;
            
            html += '<div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #ddd;">';
            html += '<h5 style="margin: 0 0 10px 0;">原始内容:</h5>';
            html += `<pre style="white-space: pre-wrap; word-break: break-all; font-size: 12px; background: #f8f9fa; padding: 10px; border-radius: 4px; max-height: 400px; overflow-y: auto;">${textData}</pre>`;
            html += '</div>';
            
            html += '</div>';
            apiOutput.innerHTML = html;
        }
    } catch (error) {
        apiOutput.innerHTML = `<div style="color: red;">请求失败: ${error.message}</div>`;
    }
}

// 页面加载完成后添加事件监听器
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('xrayForm');
    const clearBtn = document.getElementById('clearBtn');
    const testApiBtn = document.getElementById('testApiBtn');
    const testTextBtn = document.getElementById('testTextBtn');
    const shortenBtn = document.getElementById('shortenBtn');
    
    form.addEventListener('submit', generateXrayUrl);
    clearBtn.addEventListener('click', clearForm);
    testApiBtn.addEventListener('click', testApiParse);
    testTextBtn.addEventListener('click', testTextMode);
    shortenBtn.addEventListener('click', generateShortUrl);
});
