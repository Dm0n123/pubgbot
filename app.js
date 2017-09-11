const Discord = require("discord.js");
const ffmpeg = require("ffmpeg");
const ytdl = require("ytdl-core");
const request = require("request");
const fs = require("fs");
const getYoutubeID = require("get-youtube-id");
const fetchVideoInfo = require("youtube-info");
const client = new Discord.Client();

var strats = JSON.parse(fs.readFileSync("./strats.json", "utf-8"));
var config = JSON.parse(fs.readFileSync("./settings.json", "utf-8"));

const yt_api_key = config.yt_api_key;
const bot_controller = config.bot_controller;
const prefix = config.prefix;
const discord_token = config.discord_token;

client.on("ready", function() {
    console.log("Ready");
});

var servers = {};

var queue = [];
var queueNames = [];
var isPlaying = false;
var dispatcher = null;
var voiceChannel = null;
var skipReq = 0;
var skippers = [];

client.on("message", function(message) {
    if(message.author.equals(client.user)) return;
    if(!message.content.startsWith(prefix)) return;

    var args = message.content.substring(prefix.length).split(" ");

    if(!servers[message.guild.id]) {
        guild[message.guild.id] = {
            queue = [],
            queueNames = [],
            isPlaying = false,
            dispatcher = null,
            voiceChannel = null,
            skipReq = 0,
            skippers = []
        };
    }

    switch (args[0]) {
        case "help":
                var sender = message.member;
            if(sender == null) {
                 message.reply("```The commands that you can use are: \n!strat ~ Sends you a random strat! \n!brexit ~ Sends a random ass brexit thing! \n!play ~ Put a youtube link after this and it will play! \n!skip ~ This will skip the current song! \n!stop ~ This will stop the bot!```");
             } else {
                 sender.sendMessage("```The commands that you can use are: \n!strat ~ Sends you a random strat! \n!brexit ~ Sends a random ass brexit thing!```");
            }
            break;
    
        case "strat":
            var strat = Math.floor(Math.random()*strats.length);
            message.reply("**" + strats[strat].name + "**, " + strats[strat].description);
            break;
        
        case "brexit":
            message.reply("For proof that I (Jack/in3ert) really did do brexit then go forward too www.jackdidbrexit.top");
            break;
        case "play":
            if(queue.length > 0 || isPlaying) {
                getID(args[1], function(id) {
                    add_to_queue(id, message);
                    fetchVideoInfo(id, function(err, videoInfo) {
                        if(err) throw new Error(err);
                        message.channel.sendMessage("Added to queue: **" + videoInfo.title + "**");
                        queueNames.push(videoInfo.title);
                    });
                });
            } else {
                isPlaying = true;
                getID(args[1], function(id) {
                    queue.push("placeholder");
                    playMusic(id, message);
                    fetchVideoInfo(id, function(err, videoInfo) {
                        if(err) throw new Error(err);
                        message.channel.sendMessage("Now playing: **" + videoInfo.title + "**");
                    });
                });
            }
            break;

        case "skip":
            if(queue <= 0) {
                message.channel.sendMessage("There are no songs to be skipped!");
            } else {
                if(skippers.indexOf(message.author.id) == -1) {
                    skippers.push(message.author.id);
                    skipReq++;
                    if(skipReq >= Math.ceil((voiceChannel.members.size -1) /2)) {
                        skip_song(message);
                        message.channel.sendMessage("Your skip has been noted. Skipping now!");
                    } else {
                        message.channel.sendMessage("Your skip has been noted. You need **" + Math.ceil((voiceChannel.members.size - 1)/2 - skipReq) + "** more skip votes!");
                    }
                 } else {
                      message.reply("You have allready voted to skip!");
                 }
            }
            break;
        
        case "queue":
            var list = "```";
            for(var i = 0;i < queueNames.length; i++) {
                var temp = (i + 1) + ": " + queueNames[i] + (i == 0 ? " **(Current Song)**" : "") + "\n";
                if((list + temp).length <= 2000 - 3) {
                    list += temp;
                } else {
                    list += "```";
                    message.channel.sendMessage(list);
                    list = "```";
                }
            }
            list += "```";
            message.channel.sendMessage(list);
            break;
        
        default:
            message.channel.sendMessage("Invalid command");
    }
});

function skip_song() {
    dispatcher.end();
    if(queue.length > 1) {
        playMusic(queue[0], message); 
    } else {
        skipReq = 0;
        skippers = [];
    }
}

function playMusic(id, message) {
    voiceChannel = message.member.voiceChannel;

    voiceChannel.join().then(function(connection) {
        stream = ytdl("https://www.youtube.com/watch?v=" + id, {
            filter: "audioonly"
        });
        skipReq = 0;
        skippers = [];

        dispatcher = connection.playStream(stream);
        dispatcher.on("end", function() {
            skipReq = 0;
            skippers = [];
            queue.shift();
            queueNames.shift();
            if(queue.length == 0) {
                queue = [];
                queueNames = [];
                isPlaying = false;
            } else {
                setTimeout(function () {
                    playMusic(queue[0], message);
                }, 500)
            }
        });
    });
}

function getID(string, callback) {
    if(isYoutube(string)) {
        callback(getYoutubeID(string));
    } else {
        search_video(string, function(id) {
            callback(id);
        });
    }
}

function add_to_queue(stringID, message) {
    if(isYoutube(stringID)) {
        queue.push(getYoutubeID(stringID));
    } else {
        queue.push(stringID);
    }
}

function search_video(query, callback) {
    request("https://www.googleapis.com/youtube/v3/search?part=id&type=video&q=" + encodeURIComponent(query) + "&key=" + yt_api_key, function(error, response, body) {
        var json = JSON.parse(body)
        if(!json.items[0]) callback("-3qVOGtrIrk");
        else {
            callback(json.items[0].id.videoId);
        }
    });
}

function isYoutube(string) {
    return string.toLowerCase().indexOf("youtube.com") > -1;
}

client.login(discord_token);
