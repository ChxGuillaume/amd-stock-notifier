require('dotenv').config()

const axios = require('axios');
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

bot.setMyCommands([
    {
        command: 'get_state',
        description: 'Get stock state'
    }
]);

bot_listener.start((ctx) => {
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
                const productOutOfStock = html.querySelector('.product-out-of-stock');
                product.stock = !productOutOfStock;
            })
            .catch(() => ctx.reply('Oops, i got a bug!'));
    }
}
fetchProductsStatus();

var job = new CronJob(
	'0 0/30 * * * *',
	() => fetchProductsStatus(),
	null,
	true
);