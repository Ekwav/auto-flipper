import { createBot } from 'mineflayer'
import { createFastWindowClicker } from './fastWindowClick'
import { initLogger, log, printMcChatToConsole } from './logger'
import { clickWindow, isCoflChatMessage, removeMinecraftColorCodes, sleep } from './utils'
import { onWebsocketCreateAuction } from './sellHandler'
import { tradePerson } from './tradeHandler'
import { swapProfile } from './swapProfileHandler'
import { flipHandler, onItemWhitelistedMessage } from './flipHandler'
import { claimSoldItem, registerIngameMessageHandler } from './ingameMessageHandler'
import { MyBot, TextMessageData } from '../types/autobuy'
import { getConfigProperty, initConfigHelper, updatePersistentConfigProperty } from './configHelper'
import { getSessionId } from './coflSessionManager'
import { sendWebhookInitialized } from './webhookHandler'
import { handleCommand, setupConsoleInterface } from './consoleHandler'
import { initAFKHandler, tryToTeleportToIsland } from './AFKHandler'
import { pathfinder, Movements, goals } from 'mineflayer-pathfinder'
import { createMouse } from 'mineflayer-mouse';
import { Movement } from 'mineflayer-movement'
import injectSmoothLook from './smoothlook';
import { SmoothLook } from '@nxg-org/mineflayer-smooth-look/lib/smoothLook'


import { runSequence } from './sequenceRunner'
import { Vec3 } from 'vec3'
const WebSocket = require('ws')

var prompt = require('prompt-sync')()
const movement = require("mineflayer-movement")
const { loader } = require("@nxg-org/mineflayer-smooth-look");
initConfigHelper()
initLogger()
const version = 'af-2.0.0'
let _websocket: WebSocket
let ingameName = getConfigProperty('INGAME_NAME')

if (!ingameName) {
    ingameName = prompt('Enter your ingame name: ')
    updatePersistentConfigProperty('INGAME_NAME', ingameName)
}

let port = 36649

// setup environment, put one bot at Vec3(-32.7, 71, -76)
const bazaar: MyBot = createBot({
    username: "Bazaar",
    version: '1.8.9',
    port: port,
    host: 'localhost'
})
bazaar.loadPlugin(pathfinder)
bazaar.once('spawn', async () => {
    bazaar.pathfinder.setGoal(new goals.GoalBlock(-32.7,71, -77))
})


log(`Starting BAF v${version} for ${ingameName}`, 'info')
const bot: MyBot = createBot({
    username: "Hello_world",
    version: '1.8.9',
    port: port,
    host: 'localhost'
})


bot.loadPlugin(loader);
bot.loadPlugin(movement.plugin)
bot.loadPlugin(createMouse());

// Coordinates of the Bazaar in Hypixel Skyblock (adjust as needed)
let BAZAAR_COORDINATES = new Vec3(-32.7, 72.5, -76);

// Add the pathfinder plugin to the bot
bot.loadPlugin(pathfinder);

// Inject the smooth look plugin
bot.once('spawn', async () => {
    // start pressing the 'W' key to move forward
    setTimeout(() => {
        bot.clearControlStates();
    }, 8000);
    try {
        bot.setControlState('forward', true);
        await sleep(400);
        bot.smoothLook.lookAt(new Vec3(-8.22, 71.1, -93.22), true, 0.99);
        bot.setControlState('sprint', true);
        await sleep(400);
        bot.smoothLook.lookAt(new Vec3(-18.22, 72.1, -91.22), true, 0.99);
        await sleep(400);
        bot.smoothLook.lookAt(new Vec3(-20.22, 72.2, -83.21), true, 0.99);
        await sleep(400);

        for (let id = 0; id < 2; id++) {
            console.log('tilting');
            bot.smoothLook.lookAt(BAZAAR_COORDINATES, true, 0.99);
            console.log('sleeping');
            await sleep(2000);
            console.log('walking towards the Bazaar');
        }
        bot.clearControlStates();
        bot.pathfinder.setGoal(new goals.GoalFollow(bazaar.entity, 1.5)); // Follow the Bazaar bot with a proximity of 1 block
        await sleep(2000); // Wait for the bot to start moving
        bot.pathfinder.setGoal(null);
        if (bazaar.entity) {
            // Randomize the look position a bit for more human-like behavior
            const randomOffset = () => (Math.random() - 0.5) * 0.4; // +/-0.2 blocks
            const targetPos = bazaar.entity.position.offset(
                randomOffset(),
                bazaar.entity.height / 2 + randomOffset() + 0.5,
                randomOffset()
            );
            bot.smoothLook.lookAt(targetPos, true);
            await sleep(500);
            const { entity, cursorBlock, cursorBlockDiggable } = bot.mouse.getCursorState();
            bot.leftClick();
            console.log('Punched the Bazaar bot!');
        } else {
            console.log('Bazaar entity not found, cannot punch.');
        }
        console.log('Stopped moving forward');
    } catch (error) {
        bot.clearControlStates();
        console.error('Error during bot movement:', error);
    }


    // Start moving to the Bazaar when the bot spawns
    //moveToCoordinates(bot, BAZAAR_COORDINATES);
});


// Function to move the bot towards the target coordinates with dynamic look adjustment
async function moveToCoordinates(bot: MyBot, target: Vec3): Promise<void> {
    // Set pathfinding goal
    var movements = new Movements(bot);
    movements.allowFreeMotion = true; // Allow free motion for smoother movement
    bot.pathfinder.setMovements(movements);
    bot.pathfinder.setGoal(new goals.GoalNear(target.x, target.y, target.z, 1)); // GoalNear: 1 block proximity

    // Track if we are adjusting the bot's view
    let lastYaw = bot.entity.yaw;
    let lastPitch = bot.entity.pitch;

    // Interval to adjust the bot's look every 500ms (not too frequent)
    /* const updateInterval = setInterval(() => {
       if (!bot.pathfinder.isMoving()) {
         clearInterval(updateInterval); // Stop adjusting when bot stops moving
         return;
       }
   
       // Get the yaw and pitch needed to face the target
       const { yaw, pitch } = getYawAndPitchToTarget(bot, target);
   
       // Only update yaw and pitch if there's a significant difference
       if (Math.abs(lastYaw - yaw) > 0.01 || Math.abs(lastPitch - pitch) > 0.01) {
         // Adjust the bot's look smoothly towards the target (with jitter and optional head bobbing)
         bot.smoothLook(yaw, pitch, 30, 5, 0.01, false); // You can adjust the jitterAmount and headBobbing if needed
         lastYaw = yaw;
         lastPitch = pitch;
       }
     }, 50); // Update every 500ms */

    // Log when the bot reaches the goal
    bot.on('goal_reached', () => {
        console.log('Bot has reached the Bazaar!');
        if (BAZAAR_COORDINATES.x <= -32)
            BAZAAR_COORDINATES.x = -3
        else
            BAZAAR_COORDINATES.x = -33
        moveToCoordinates(bot, BAZAAR_COORDINATES); // Move back and forth between two points
    });
}

// Handle bot errors (such as disconnection or errors)
bot.on('error', (err) => {
    console.error('Bot encountered an error:', err);
});

// Handle bot's disconnection (reconnect if necessary)
bot.on('end', () => {
    console.log('Bot disconnected. Attempting to reconnect...');
    setTimeout(() => {
        // bot.connect();
    }, 5000); // Reconnect after 5 seconds
});






function connectWebsocket(url: string = getConfigProperty('WEBSOCKET_URL')) {
    log(`Called connectWebsocket for ${url}`)
    _websocket = new WebSocket(`${url}?player=${bot.username}&version=${version}&SId=${getSessionId(ingameName)}`)
    _websocket.onopen = function () {
        log(`Opened websocket to ${url}`)
        setupConsoleInterface(bot)
        sendWebhookInitialized()
        updatePersistentConfigProperty('WEBSOCKET_URL', url)
    }
    _websocket.onmessage = function (msg) {
        try {
            onWebsocketMessage(msg)
        } catch (e) {
            log('Error while handling websocket message: ' + e, 'error')
            log('Message: ' + JSON.stringify(msg), 'error')
        }
    }
    _websocket.onclose = function (e) {
        printMcChatToConsole('§f[§4BAF§f]: §4Connection closed. Reconnecting...')
        log('Connection closed. Reconnecting... ', 'warn')
        setTimeout(function () {
            connectWebsocket()
        }, 1000)
    }
    _websocket.onerror = function (err) {
        log('Connection error: ' + JSON.stringify(err), 'error')
        _websocket.close()
    }
}

async function onWebsocketMessage(msg) {
    let message = JSON.parse(msg.data)
    let data = JSON.parse(message.data)

    switch (message.type) {
        case 'flip':
            log(message, 'debug')
            flipHandler(bot, data)
            break
        case 'chatMessage':
            if (data.length > 1 && data[1].text.includes('matched your Whitelist entry:') && !isCoflChatMessage(data[1].text)) {
                onItemWhitelistedMessage(data[1].text)
            }

            for (let da of [...(data as TextMessageData[])]) {
                let isCoflChat = isCoflChatMessage(da.text)
                if (!isCoflChat) {
                    log(message, 'debug')
                }
                if (getConfigProperty('USE_COFL_CHAT') || !isCoflChat) {
                    printMcChatToConsole(da.text)
                }
            }
            break
        case 'writeToChat':
            let isCoflChat = isCoflChatMessage(data.text)
            if (!isCoflChat) {
                log(message, 'debug')
            }
            if (getConfigProperty('USE_COFL_CHAT') || !isCoflChat) {
                printMcChatToConsole((data as TextMessageData).text)
            }
            break
        case 'swapProfile':
            log(message, 'debug')
            swapProfile(bot, data)

            break
        case 'createAuction':
            log(message, 'debug')
            onWebsocketCreateAuction(bot, data)
            break
        case 'trade':
            log(message, 'debug')
            tradePerson(bot, data)
            break
        case 'tradeResponse':
            let tradeDisplay = (bot.currentWindow.slots[39].nbt.value as any).display.value.Name.value
            if (tradeDisplay.includes('Deal!') || tradeDisplay.includes('Warning!')) {
                await sleep(3400)
            }
            clickWindow(bot, 39)
            break
        case 'getInventory':
            log('Uploading inventory...')
            let wss = await getCurrentWebsocket()
            wss.send(
                JSON.stringify({
                    type: 'uploadInventory',
                    data: JSON.stringify(bot.inventory)
                })
            )
            break
        case 'execute':
            log(message, 'debug')
            handleCommand(bot, data)
            break
        case 'runSequence':
            log(message, 'debug')
            break
        case 'privacySettings':
            log(message, 'debug')
            data.chatRegex = new RegExp(data.chatRegex)
            bot.privacySettings = data
            break
    }
}

bot.on('end', (reason) => {
    console.log(`Bot disconnected. Reason: ${reason}`);
    log(`Bot disconnected. Reason: ${reason}`, 'warn')
});

async function onScoreboardChanged() {
    if (
        bot.scoreboard.sidebar.items.map(item => item.displayName.getText(null).replace(item.name, '')).find(e => e.includes('Purse:') || e.includes('Piggy:'))
    ) {
        bot.removeListener('scoreboardTitleChanged', onScoreboardChanged)
        log('Joined SkyBlock')
        initAFKHandler(bot)
        setTimeout(async () => {
            let wss = await getCurrentWebsocket()
            log('Waited for grace period to end. Flips can now be bought.')
            bot.state = null
            bot.removeAllListeners('scoreboardTitleChanged')

            wss.send(
                JSON.stringify({
                    type: 'uploadScoreboard',
                    data: JSON.stringify(bot.scoreboard.sidebar.items.map(item => item.displayName.getText(null).replace(item.name, '')))
                })
            )
        }, 5500)
        await sleep(2500)
        tryToTeleportToIsland(bot, 0)

        await sleep(20000)
        // trying to claim sold items if sold while user was offline
        claimSoldItem(bot)
    }
}

export function changeWebsocketURL(newURL: string) {
    _websocket.onclose = () => { }
    _websocket.close()
    if (_websocket.readyState === WebSocket.CONNECTING || _websocket.readyState === WebSocket.CLOSING) {
        setTimeout(() => {
            changeWebsocketURL(newURL)
        }, 500)
        return
    }
    connectWebsocket(newURL)
}

export async function getCurrentWebsocket(): Promise<WebSocket> {
    if (_websocket.readyState === WebSocket.OPEN) {
        return _websocket
    }
    return new Promise(async resolve => {
        await sleep(1000)
        let socket = await getCurrentWebsocket()
        resolve(socket)
    })
}

