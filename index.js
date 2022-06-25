(async function() {
const alfy = await (await import('alfy')).default;
const osLocale = require('os-locale');

const newList = []; // used in updateList()
const query = [];
const output = [];
const promises = [];
const api = 'https://open.er-api.com/v6';
const currencies = ["IRR", "KGS", "PGK", "JOD", "NOK", "MUR", "UAH", "DKK", "KHR", "XPF", "TZS", "PYG", "SAR", "PHP", "RUB", "EGP", "LRD", "MOP", "LYD", "AFN", "RSD", "none", "TMT", "HNL", "SHP", "MGA", "UZS", "MDL", "AWG", "KWD", "UYU", "MWK", "GMD", "ZMW", "RWF", "ISK", "GNF", "KRW", "HKD", "NPR", "XCD", "BZD", "GTQ", "MZN", "BHD", "MRU", "AMD", "ILS", "PLN", "SCR", "GIP", "CRC", "GHS", "TJS", "IQD", "CZK", "HUF", "KZT", "SYP", "BTN", "GBP", "SRD", "AED", "XOF", "MXN", "CDF", "MKD", "SOS", "BDT", "CVE", "ALL", "BAM", "WST", "RON", "VUV", "AZN", "HTG", "CHF", "GYD", "FJD", "BWP", "TWD", "ETB", "BND", "CLP", "BYN", "MMK", "XDR", "ARS", "COP", "DJF", "AOA", "LKR", "TTD", "NAD", "KPW", "SEK", "KYD", "IMP", "MYR", "PKR", "QAR", "THB", "KMF", "BGN", "NGN", "INR", "TOP", "MVR", "YER", "ZAR", "JPY", "MAD", "MNT", "CUP", "DOP", "PEN", "BBD", "CAD", "ERN", "JEP", "ANG", "NIO", "OMR", "JMD", "HRK", "SDG", "SZL", "FKP", "BOB", "GEL", "GGP", "EUR", "BIF", "LAK", "SBD", "TRY", "SSP", "NZD", "CNY", "KES", "BRL", "IDR", "BSD", "AUD", "SLL", "VND", "BMD", "TND", "LBP", "UGX", "LSL", "USD", "STN", "DZD", "SGD", "VES", "XAF"] // 158 currency
const favoriteCurrency = (alfy.cache.get('favoriteCurrency') || []).filter(favCur => currencies.includes(favCur)); // this is where custom list is stored
const lastUpdate = new Date(alfy.cache.get('updateDate'));
const nextUpdate = new Date(alfy.cache.get('nextUpdate'));
const l = alfy.cache.get('locale') || 'en-GB';
const locale = l.replace('_', '-');
const baseCurrency = alfy.cache.get('baseCurrency');
const q = alfy.input.toUpperCase().replace('$', 'USD').replace('€', 'EUR').replace('£', 'GBP').replace('¥', 'JPY').replace('₩', 'KRW').replace('₽', 'RUB').replace('₹', 'INR').split(/(\d*[.,]?\d+)([A-z]{1,3})/);

const REMOVE_FAV_ARG = 'RM-FAV';
const RESET_FAV_ARG = 'RESET-FAV';
const LIST_FAV_ARG = 'LIST-FAV';
const BASE_CURRENCY_ARG = 'BASE';

q.forEach(item => item.split(" ").filter(item => item.length > 0).forEach(item => query.push(item)));

function getOSLocale() {
    return osLocale().then(locale => alfy.cache.set('locale', locale));
}

function cacheRates(data) {
    const rates = data['rates'];
    Object.keys(rates).forEach(cur => alfy.cache.set(cur, rates[cur]));
    const lastUpdateTime = new Date(data['time_last_update_utc']);
    const nextUpdateTime = new Date(data['time_next_update_utc']);
    alfy.cache.set('nextUpdate', nextUpdateTime);
    alfy.cache.set('updateDate', lastUpdateTime);
    alfy.cache.set('baseCurrency', data['base_code']);
}

function updateRates(base) {
    return alfy.fetch(`${api}/latest/${base}`).then(cacheRates);
}

function addBaseOutput() {
    /*
    Added Base Output For New Feature
    Which lead users to customize their favorite currency list
    */

    // 'curcon LIST_FAV_ARG' to add favorite currency list
    output.push({
        title: 'Add a currency to favorite list',
        subtitle: `You can customize your favorite currency list`,
        arg: LIST_FAV_ARG + ' ',
        autocomplete: LIST_FAV_ARG + ' ',
        icon: {
            path: 'settings.png'
        }
    });

    // 'curcon REMOVE_FAV_ARG' to remove specific currency from the list
    output.push({
        title: 'Remove a currency from favorite list',
        subtitle: `Remove a currency from your favorite currency list`,
        arg: REMOVE_FAV_ARG + ' ',
        autocomplete: REMOVE_FAV_ARG + ' ',
        icon: {
            path: 'settings.png'
        }
    });

    // 'curcon RESET_FAV_ARG' to reset favorite currency list
    output.push({
        title: 'Reset custom favorite currency list',
        subtitle: `Reset your favorite currency list`,
        arg: RESET_FAV_ARG + ' ',
        autocomplete: RESET_FAV_ARG + ' ',
        icon: {
            path: 'settings.png'
        }
    });

    output.push({
        title: 'Set/Update base currency',
        subtitle: `current base currency is: ${baseCurrency}`,
        arg: BASE_CURRENCY_ARG + ' ',
        autocomplete: BASE_CURRENCY_ARG + ' ',
        icon: {
            path: 'settings.png'
        }
    });

    output.push({
        title: `Type amount to see current rates for ${baseCurrency}`,
        subtitle: `rates last updated: ${lastUpdate.toLocaleString(locale)}, next update: ${nextUpdate.toLocaleString(locale)}`,
        arg: '1',
        autocomplete: '1',
        icon: {
            path: `flags/${baseCurrency}.png`
        }
    });
}

function addSetBaseCurrencyListOutput(currency) {
    output.push({
        title: `Set base currency to: ${currency}`,
        icon: {
            path: `flags/${currency}.png`
        },
        arg: `${BASE_CURRENCY_ARG} ${currency}`
    })
}

function addUpdateRatesOutput(currency) {
    output.push({
        title: `Set ${currency} as base and update rates`,
        icon: {
            path: `flags/${currency}.png`
        },
        arg: ''
    })
}

function addCurrencyListOutput(multiplier, currency) {
    if (currency !== baseCurrency) {
        const rate = alfy.cache.get(currency);
        const amount = Number(multiplier.replace(',', '')); // I guess 1,000$ should be 1000$, not 1.000$
        const baseAmount = Number(amount / rate);
        const currencyAmount = Number(rate * amount);
        output.push({
            title: `${amount.toLocaleString(locale)} ${currency} = ${baseAmount.toLocaleString(locale)} ${baseCurrency}`,
            icon: {
                path: `flags/${currency}.png`
            },
            arg: `${amount.toLocaleString(locale)} ${currency}`,
            autocomplete: `${amount.toLocaleString(locale)} ${currency}`,
            text: {
                copy: `${baseAmount.toLocaleString(locale)}`,
                largetype: `${amount.toLocaleString(locale)} ${currency} = ${baseAmount.toLocaleString(locale)} ${baseCurrency}`
            }
        });

        // This will show the opposite conversion
        output.push({
            title: `${amount.toLocaleString(locale)} ${baseCurrency} = ${currencyAmount.toLocaleString(locale)} ${currency}`,
            icon: {
                path: `flags/${baseCurrency}.png`
            },
            arg: `${currencyAmount.toLocaleString(locale)}`,
            variables: {
                function: 'copy'
            },
            text: {
                copy: `${baseAmount.toLocaleString(locale)}`,
                largetype: `${amount.toLocaleString(locale)} ${baseCurrency} = ${baseAmount.toLocaleString(locale)} ${currency}`
            }
        });
    }
}


function addCurrencyOutput(multiplier, currency) {
    const rate = alfy.cache.get(currency);
    const amount = Number(multiplier.replace(',', ''));  // I guess 1,000$ should be 1000$, not 1.000$
    const baseAmount = Number(amount / rate);
    const currencyAmount = Number(rate * amount);
    output.push({
        title: `${amount.toLocaleString(locale)} ${currency} = ${baseAmount.toLocaleString(locale)} ${baseCurrency}`,
		subtitle: `${amount.toLocaleString(locale)} ${baseCurrency} = ${currencyAmount.toLocaleString(locale)} ${currency}`,
        icon: {
            path: `flags/${currency}.png`
        },
        arg: `${baseAmount.toLocaleString(locale)}`,
        variables: {
            function: 'copy'
        },
        text: {
            copy: `${baseAmount.toLocaleString(locale)}`,
            largetype: `${amount.toLocaleString(locale)} ${currency} = ${baseAmount.toLocaleString(locale)} ${baseCurrency}`
        }
    });
}

/*
    Added few functions
*/

// Show baseCurrency => currency as subtitle in main page
// I used this because it's a bit messy if it's showed as a title instad of subtitle
// in main page
function addCurrencyMainListOutput(multiplier, currency) {
    if (currency !== baseCurrency) {
        var rate = alfy.cache.get(currency);
        var amount = Number(multiplier.replace(',', ''));
        var baseAmount = Number(amount / rate);
        var currencyAmount = Number(rate * amount);

        output.push({
            title: `${amount.toLocaleString(locale)} ${currency} = ${baseAmount.toLocaleString(locale)} ${baseCurrency}`,
            subtitle: `${amount.toLocaleString(locale)} ${baseCurrency} = ${currencyAmount.toLocaleString(locale)} ${currency}`,
            icon: {
                path: `flags/${currency}.png`
            },
            arg: `${amount.toLocaleString(locale)} ${currency}`,
            autocomplete: `${amount.toLocaleString(locale)} ${currency}`,
            text: {
                copy: `${baseAmount.toLocaleString(locale)}`,
                largetype: `${amount.toLocaleString(locale)} ${currency} = ${baseAmount.toLocaleString(locale)} ${baseCurrency}`
            }
        });
    }
}

// Update Favorite List
function updateList(list) {
    if (favoriteCurrency == "" || typeof favoriteCurrency == "undefined") { // if it hasn't been set yet
        newList.push(list);
        alfy.cache.set('favoriteCurrency', newList);
    }
    else if (!favoriteCurrency.includes(list)) { // if it's not in the list
        favoriteCurrency.push(list);
        alfy.cache.set('favoriteCurrency', favoriteCurrency);
    }
}

function reomoveList(list) {
    // remove 'list' from favoriteCurrency
    for(let i = 0; i < favoriteCurrency.length; i++) {
        if(favoriteCurrency[i] === list)  {
            favoriteCurrency.splice(i, 1);
            break;
        }
    }
    alfy.cache.set('favoriteCurrency', favoriteCurrency);
}

function addUpdateListOutput(currency) {
    output.push({
        title: `Add ${currency} to favorite currency list`,
        icon: {
            path: `flags/${currency}.png`
        },
        arg: ''
    });
}

function addRemoveListOutput(currency) {
    output.push({
        title: `Remove ${currency} from favorite currency list`,
        icon: {
            path: `flags/${currency}.png`
        },
        arg: ''
    });
}

function addFavoriteCurrencyListOutput(currency) {
    output.push({
        title: `Add ${currency} to favorite currency list`,
        icon: {
            path: `flags/${currency}.png`
        },
        arg: `${LIST_FAV_ARG} ${currency}`
    });
}

// Remove a Currency from list
function removeFavoriteCurrencyListOutput(currency) {
    output.push({
        title: `Remove ${currency} from favorite currency list`,
        icon: {
            path: `flags/${currency}.png`
        },
        arg: `${REMOVE_FAV_ARG} ${currency}`
    });
}

// Reset Favorite List
function resetfavoriteCurrency() {
    output.push({
        title: `Reset customized query list`,
        icon: {
            path: 'settings.png'
        },
        arg: `${RESET_FAV_ARG} GO` // double check the reset
    });
}

function resetConfirmed() {
    alfy.cache.set('favoriteCurrency', ""); // reset cache to ""
}

function addResetOutput() {
    output.push({
        title: `Reset completed, press Enter to continue`,
        icon: {
            path: `settings.png`
        },
        arg: LIST_FAV_ARG + ' ' // There must be at least one currency in favoriteCurrency
    });
}


if (nextUpdate < new Date()){
    promises.push(getOSLocale());
    promises.push(updateRates(baseCurrency));
    output.push({
        title: `INFO: Rates for ${baseCurrency} updated: ${new Date(alfy.cache.get('updateDate')).toLocaleString(locale)}`,
        subtitle: `next update: ${new Date(alfy.cache.get('nextUpdate')).toLocaleString(locale)}`,
        icon: {
            path: 'settings.png'
        }
    });
}

if (query[0] !== BASE_CURRENCY_ARG && (!baseCurrency || !lastUpdate)) {
    promises.push(getOSLocale());
    if (!query[0]) {
        currencies.forEach(currency => addSetBaseCurrencyListOutput(currency));
    } else if (query[0].match('^[A-Z]{1,2}$')) {
        currencies.filter(currency => currency.includes(query[0])).forEach(currency => addSetBaseCurrencyListOutput(currency));
    } else if (currencies.includes(query[0])) {
        addSetBaseCurrencyListOutput(query[0]);
    }
}

/*
    Check if the favorite currency list is set or not
    before all
*/

else if ((favoriteCurrency == "" || typeof favoriteCurrency == "undefined") && query[0] !== LIST_FAV_ARG && query[0] !== BASE_CURRENCY_ARG) {
    promises.push(getOSLocale());
    if (!query[0]) {
        currencies.forEach(currency => addFavoriteCurrencyListOutput(currency));
    } else if (query[0].match('^[A-Z]{1,2}$')) {
        currencies.filter(currency => currency.includes(query[0])).forEach(currency => addFavoriteCurrencyListOutput(currency));
    } else if (currencies.includes(query[0])) {
        addFavoriteCurrencyListOutput(query[0]);
    }
}

else if (!query[0]) {
    favoriteCurrency.forEach(currency => addCurrencyMainListOutput('1', currency));
    // show favorite currency list in first page
    addBaseOutput();
    // show settings below the currencies list
} else if (query[0] === BASE_CURRENCY_ARG && !query[1]) {
    currencies.forEach(currency => addSetBaseCurrencyListOutput(currency));
} else if (query[0] === BASE_CURRENCY_ARG && query[1]) {
    if (query[1].match('^[A-Z]{1,2}$')) {
        currencies.filter(currency => currency.includes(query[1])).forEach(currency => addSetBaseCurrencyListOutput(currency));
    } else if (currencies.includes(query[1])) {
        promises.push(getOSLocale());
        promises.push(updateRates(query[1]));
        addUpdateRatesOutput(query[1]);
    }
}

/*
    Add / Remove / Reset favorite currency list
*/
else if (query[0] === LIST_FAV_ARG && !query[1]) {
    currencies.forEach(currency => addFavoriteCurrencyListOutput(currency));
} else if (query[0] === LIST_FAV_ARG && query[1]) {
    if (query[1].match('^[A-Z]{1,2}$')) {
        currencies.filter(currency => currency.includes(query[1])).forEach(currency => addFavoriteCurrencyListOutput(currency));
    } else if (currencies.includes(query[1])) {
        promises.push(getOSLocale());
        promises.push(updateList(query[1]));
        addUpdateListOutput(query[1]);
    }
} else if (query[0] === REMOVE_FAV_ARG && !query[1]) {
    if (typeof favoriteCurrency != "undefined" && favoriteCurrency != "") { // only if there's a value in list
        favoriteCurrency.forEach(currency => removeFavoriteCurrencyListOutput(currency));
    }
} else if (query[0] === REMOVE_FAV_ARG && query[1]) {
    if (typeof favoriteCurrency != "undefined" && favoriteCurrency != "") {
        if (query[1].match('^[A-Z]{1,2}$')) {
            favoriteCurrency.filter(currency => currency.includes(query[1])).forEach(currency => removeFavoriteCurrencyListOutput(currency));
        } else if (favoriteCurrency.includes(query[1])) {
            promises.push(getOSLocale());
            reomoveList(query[1]);
            addRemoveListOutput(query[1]);
        }
    }
} else if (query[0] === RESET_FAV_ARG && !query[1]) {
    resetfavoriteCurrency();
} else if (query[0] === RESET_FAV_ARG && query[1] == 'GO') {
    resetConfirmed();
    addResetOutput(query[1]);
} else if (query[0].match(/\d*([.,]?\d+)/) && !query[1]) {
    favoriteCurrency.forEach(currency => addCurrencyListOutput(query[0], currency));
    // if query only with numbers, show the results of which currency only in favoriteCurrency
} else if (query[0].match(/\d*([.,]?\d+)/) && query[1]) {
    if (query[1].match('^[A-Z]{1,2}$')) {
        currencies.filter(currency => currency.includes(query[1])).forEach(currency => addCurrencyListOutput(query[0], currency));
    } else if (currencies.includes(query[1]) && query[1] !== baseCurrency) {
        addCurrencyOutput(query[0], query[1]);
    }
}

Promise.all(promises).then(() => {
    alfy.output(output)
});

})();
