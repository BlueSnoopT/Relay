
// The manager so to say that runs the relay
// Note it only runs based on the accounts givin


// Date
const { time, log, clear } = require('console');
const dateformat = require('dateformat');
var player = require('play-sound')(opts = {})
 
// Natives
const fs = require('fs');
const shell = require('shelljs');
const Tail = require('tail').Tail;
var requestpromise = require("request-promise-native");
const { exit } = require('process');

// Run
async function Run()
{
    // Token
    const Token = require('../Account/Accounts.json')['Account 1'].Token;
    const Channel = require('../Account/Accounts.json')['Account 1'].Channel;
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    // Color Scheme
    let RED = "\x1b[31m";
    let BLUE = "\x1b[34m";
    let GREY = "\x1b[30m";

    // Data
    var Queue = [];
    var Stacker = [];
    
    // Stack data
    const Stackz_t = 10;
    var Stacks_t = 0;

    // Spam data
    let SpamData = {};
    let Muted = {};

    // Terminal Logging
    let Watching = {};
    var Tails_t = [];

    // A function to check messages
    function Check(Message)
    {
        var J = Stacks_t;

        for (var i = 0; i < 10; i++)
        {
            if (Stacker[J] == Message)
                return false;

            J++;

            if (J >= Stackz_t)
                J = 0;
        }

        Stacker[Stacks_t++] = Message;
        if (Stacks_t >= Stackz_t)
            Stacks_t = 0;
        
        return true;
    }

    // Push the queue
    function Line(Data)
    {
        if (Check(Data))
            Queue.push(Data);
    }

    // Split CSV results
    function CSVT(csv) 
    {
        let Result = [];
        let Current = '';
        let Quotes = false;

        for (let i = 0; i < csv.length; ++i)
        {
            if (csv[i] == '"' && csv[i + 1] == '"')
            {
                Current += '"';
                ++i;
                continue;
            }

            if (csv[i] == '"')
            {
                Quotes = !Quotes;
                continue;
            }

            if (csv[i] == ',' && !Quotes)
            {
                Result.push(Current);
                Current = '';
                continue;
            }

            Current += csv[i];
        }

        Result.push(Current);
        return Result;
    }

    // These are primary expressions to relay
    // text to both the localhost server and the 
    // TG group.
    function SendMessage(Data)
    {
        let Dates = dateformat(+Data[0] * 1000, "mm/dd/yyyy");
        let SteamID = Data[1];
        let Username = Data[2];
        let Message = Data[3];  
        let ID;
      
        ID = Math.min(Math.round(Data[4] + Math.random() + 2 - Math.random() + 1)); // More Bots, MORE!!!
        return `${Username}: ${Message}\nU:1:${SteamID} - ${Dates}\nBot ${ID}`;
    }

    function LogData()
    {
        fs.readdir('/opt/cathook/data', (error, files) => 
        {
            for (let file of files)
            {
                file = '/opt/cathook/data/' + file;

                if (!Watching[file] && /chat-.+\.csv/.exec(file))
                {
                    let Tails = new Tail(file);
                    Tails.on('line', Line);
                    Tails_t.push(Tails);
                    Watching[file] = true;
                }
            }
        });
    }
    
    // Helps remove clutter from chat
    // simply add a new filter to this
    function Remove(Data)
    {
        let Message = Data[3];
        let Username = Data[2];
        let SteamID = Data[1];

        if (Message.includes('furry')       || 
            Message.includes('weeb')        ||
            Message.includes('pedo')        ||
            Message.includes('pedos')       ||
            
            Message.includes('http')        ||
            Message.includes('https')       ||
            Message.includes('discord.gg')  ||
            Message.includes('t.me')        ||    

            Message.includes('*')           ||
            
            Message.includes("Attention! There is") || 
            Message.includes("Attention! There are") ||
            Message.includes("[BOT CHECK") ||

            Message.includes('#savetf2'))
        {
            log(`${GREY}Recived Message From [${Username}(${SteamID})] Ignorned\nMessage Recieved: ${Message}${BLUE}\n`);
            return true;
        }

        return false;
    }

    function PazerDetector(Data)
    {
        let Message = Data[3];
        let Username = Data[2];
        let SteamID = Data[1];

        let Dates = dateformat(+Data[0] * 1000, "mm/dd/yyyy");

        const Attribute = 
            {
                attribute: "Pazer",
                last_seen: {
                    name: Username,
                    time: Dates
                },
                
                steamid: `U:1:${SteamID}`,
                steamidraw: `${SteamID}`
            }
        ;

        if (Message.includes("Attention! There is") || Message.includes("Attention! There are") || Message.includes("[BOT CHECK") )
        {
            const JsonFile = JSON.parse(fs.readFileSync('Source/Pazer.json'));
            const ID = JsonFile.Players;
            var bOK = true;

            // Check if this steamID is the same in the list
            // This uses a 32-Bit Integer Limit if exceed we broke the game
            for (var i = 0; i < 2147483647; i++)
            {
                // To Far bro...
                if (ID[i] == undefined)
                    break;

                if (ID[i].steamidraw == SteamID)
                {
                    bOK = false;
                    log(`${RED}This current [U:1:${SteamID}] already exists and will be ignored${BLUE}`)
                }
            }

            JsonFile.Players.push(Attribute);
            const Final = JSON.stringify(JsonFile, null, 4);

            // If all is OK then write this ID to the list as a pazer
            if (bOK)
            {
                fs.writeFile('Source/Pazer.json', Final, { flags: "a+" }, err => {});
                log(`${RED}This current [U:1:${SteamID}] has been added to the pazer list${BLUE}`)
            }
        }   
    }

    // The primary function of Run.js that sends
    // Data to the servers and TG
    function Send()
    {
        let MSG = '​​'; 
        let MSGRAW = '';

        if (!Queue.length)
            return;

        while (Queue.length)
        {
            let CSV = Queue.shift();
            let Data = CSVT(CSV);
            let Message = SendMessage(Data);
            let Check = SendMessage(Data);

            PazerDetector(Data);

            if (Remove(Data))
                continue;

            if (MSG.indexOf(Check) != -1)
                continue;

            MSG += Message + '\n';
            MSGRAW = SendMessage(Data) + '\n\n';
        }

        if (MSGRAW == '')
            return;
        //else
            //player.play('Source/Ping.mp3', function(err){});  

        process.stdout.write(MSGRAW);
        requestpromise(`https://api.telegram.org/bot${Token}/sendMessage?chat_id=${Channel}&disable_web_page_preview=True&text=` 
                        + encodeURIComponent(MSG))
    }

    LogData();

    // Run 
    setInterval(Send);
    setInterval(LogData, 0.1);

    // Process some info!
    if (Token == '' || Channel == '')
        log(`${RED}No Token or Channel was givin in "Account/Accounts.json"\nthis will result in only the terminal reciving messages${BLUE}\n`);
}   

const Telegram = require('node-telegram-bot-api');
const Token = require('../Account/Accounts.json')['Account 1'].Token;
const Bot = new Telegram(Token);

clear(); // Telegram API fix you're broken ass Deprecated shit

Bot.getMe().then(function (info) {
    log(`\x1b[30mLogged in as ${info.first_name}\x1b[34m\n`);
});

Run(); // Run