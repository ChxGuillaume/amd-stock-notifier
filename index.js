require('dotenv').config()

const axios = require('axios');
const fs = require('fs');
const CronJob = require('cron').CronJob;
const { parse } = require('node-html-parser');
const { Telegraf, Telegram } = require('telegraf');

const amd_products = {
    '5950x': {
        name: 'Ryzen 9 5950x',
        stock: false,
        url: 'https://www.amd.com/fr/direct-buy/5450881400/fr'
    },
    '5900x': {
        name: 'Ryzen 9 5800x',
        stock: false,
        url: 'https://www.amd.com/fr/direct-buy/5450881500/fr'
    },
    '5800x': {
        name: 'Ryzen 7 5700x',
        stock: false,
        url: 'https://www.amd.com/fr/direct-buy/5450881600/fr'
    },
    '5600x': {
        name: 'Ryzen 5 5600x',
        stock: false,
        url: 'https://www.amd.com/fr/direct-buy/5450881700/fr'
    },
};

const bot_listener = new Telegraf(process.env.TELEGRAM_TOKEN);
const bot = new Telegram(process.env.TELEGRAM_TOKEN);

const job = new CronJob('0 0/30 * * * *', () => fetchProductsStatus(), null, true);

let chats = [];
loadChats();

bot.setMyCommands([
    {
        command: 'get_state',
        description: 'Get stock state'
    }
]);

bot_listener.start((ctx) => {
    addChatID(ctx.from.id);

    const sender_name = ctx.from.first_name;
    ctx.reply(`Hello ${sender_name}`);
});

bot_listener.help((ctx) => ctx.reply('Send me a sticker'))

bot_listener.hears('hi', (ctx) => {
    console.log(ctx.from);
    ctx.reply('Hey there')
})

bot_listener.command('get_state', (ctx) => {
    let status_message = '';
    for (const key in amd_products) {
        const product = amd_products[key];
        status_message += product.name + ' is ' + (product.stock ? 'in stock' : 'out of stock') + '\n';
    }
    ctx.reply(status_message);
})

bot_listener.launch()

function fetchProductsStatus() {
    console.log('Fetching products at', new Date());

    for (const key in amd_products) {
        const product = amd_products[key];
        axios
            .get(product.url)
            .then(({ data }) => {
                const html = parse(data);
                const productInStock = !html.querySelector('.product-out-of-stock');

                if (product.stock != productInStock) {
                    product.stock = productInStock;
                    telegramBroadcast(product.name + ' is ' + (product.stock ? 'in stock' : 'out of stock'));
                }
            })
            .catch(() => console.error('Oops, error fetching AMD website.'));
    }
}

fetchProductsStatus();

function telegramBroadcast(message) {
    for (const id of chats) {
        bot.sendMessage(id, message);
    }
}

function loadChats() {
    fs.access('./chat_ids.json', fs.constants.F_OK, (err) => {
        if (err) saveChats();
        else chats = JSON.parse(fs.readFileSync('./chat_ids.json', { encoding: 'utf-8' }));
    });
}

function saveChats() {
    fs.writeFileSync('./chat_ids.json', JSON.stringify(chats));
}

function addChatID(id) {
    chats.push(id);
    saveChats();
}