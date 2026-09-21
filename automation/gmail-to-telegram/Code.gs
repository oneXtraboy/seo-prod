const SYNAPSEE_CONFIG = Object.freeze({
  ownerEmail: '1extraboy@gmail.com',
  senderEmail: 'onboarding@resend.dev',
  query: 'from:onboarding@resend.dev subject:"Заявка на аудит" newer_than:30d',
  maxThreads: 50,
  processedLimit: 250
});

function setupSynapseeTelegram() {
  const settings = getSettings_();
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === 'processSynapseeAuditMail')
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('processSynapseeAuditMail')
    .timeBased()
    .everyMinutes(5)
    .create();

  sendTelegram_(settings, '✅ Synapsee: уведомления о заявках подключены. Остальные письма пересылаться не будут.');
  processSynapseeAuditMail();
}

function processSynapseeAuditMail() {
  const settings = getSettings_();
  const properties = PropertiesService.getScriptProperties();
  const processed = loadProcessedIds_(properties);
  const processedSet = new Set(processed);
  const messages = GmailApp.search(SYNAPSEE_CONFIG.query, 0, SYNAPSEE_CONFIG.maxThreads)
    .flatMap((thread) => thread.getMessages())
    .sort((left, right) => left.getDate().getTime() - right.getDate().getTime());

  for (const message of messages) {
    const messageId = message.getId();
    if (processedSet.has(messageId)) continue;

    const application = parseSynapseeApplication_(message);
    if (!application) continue;

    sendTelegram_(settings, formatTelegramMessage_(application));
    processed.push(messageId);
    processedSet.add(messageId);
    while (processed.length > SYNAPSEE_CONFIG.processedLimit) processed.shift();
    properties.setProperty('SYNAPSEE_PROCESSED_MESSAGE_IDS', JSON.stringify(processed));
  }
}

function parseSynapseeApplication_(message) {
  const from = String(message.getFrom() || '').toLowerCase();
  const to = String(message.getTo() || '').toLowerCase();
  const subject = String(message.getSubject() || '').trim();
  const body = String(message.getPlainBody() || '').replace(/\r/g, '').trim();

  if (!from.includes(SYNAPSEE_CONFIG.senderEmail)) return null;
  if (!to.includes(SYNAPSEE_CONFIG.ownerEmail)) return null;
  if (!/^Заявка на аудит https?:\/\/\S+$/u.test(subject)) return null;
  if (!body.includes('Новая заявка на аудит Synapsee')) return null;

  const fields = {};
  for (const line of body.split('\n')) {
    const separator = line.indexOf(':');
    if (separator < 1) continue;
    fields[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }

  const application = {
    id: fields.ID || '',
    name: fields['Имя'] || '',
    email: fields.Email || '',
    phone: fields['Телефон'] || '',
    website: fields['Сайт'] || '',
    service: fields['Услуга'] || '',
    source: fields['Источник'] || ''
  };

  if (!/^AUD-\d{8}-[A-F0-9]{8}$/.test(application.id)) return null;
  if (!/^https?:\/\/\S+$/.test(application.website)) return null;
  if (subject !== `Заявка на аудит ${application.website}`) return null;
  if (!application.name || !application.email || !application.phone) return null;
  return application;
}

function formatTelegramMessage_(application) {
  return [
    '<b>Новая заявка на аудит Synapsee</b>',
    `<b>ID:</b> ${escapeHtml_(application.id)}`,
    `<b>Имя:</b> ${escapeHtml_(application.name)}`,
    `<b>Email:</b> ${escapeHtml_(application.email)}`,
    `<b>Телефон:</b> ${escapeHtml_(application.phone)}`,
    `<b>Сайт:</b> ${escapeHtml_(application.website)}`,
    `<b>Услуга:</b> ${escapeHtml_(application.service)}`,
    `<b>Источник:</b> ${escapeHtml_(application.source)}`
  ].join('\n');
}

function sendTelegram_(settings, text) {
  const response = UrlFetchApp.fetch(`https://api.telegram.org/bot${settings.token}/sendMessage`, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chat_id: settings.chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    }),
    muteHttpExceptions: true
  });
  const result = JSON.parse(response.getContentText() || '{}');
  if (response.getResponseCode() !== 200 || !result.ok) {
    throw new Error(`Telegram не принял сообщение: HTTP ${response.getResponseCode()}`);
  }
}

function getSettings_() {
  const properties = PropertiesService.getScriptProperties();
  const token = String(properties.getProperty('TELEGRAM_BOT_TOKEN') || '').trim();
  const chatId = String(properties.getProperty('TELEGRAM_CHAT_ID') || '').trim();
  if (!/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)) {
    throw new Error('Добавьте TELEGRAM_BOT_TOKEN в свойства скрипта.');
  }
  if (!/^-?\d+$/.test(chatId)) {
    throw new Error('Добавьте TELEGRAM_CHAT_ID в свойства скрипта.');
  }
  return { token, chatId };
}

function loadProcessedIds_(properties) {
  try {
    const value = JSON.parse(properties.getProperty('SYNAPSEE_PROCESSED_MESSAGE_IDS') || '[]');
    return Array.isArray(value) ? value.slice(-SYNAPSEE_CONFIG.processedLimit) : [];
  } catch (error) {
    return [];
  }
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
