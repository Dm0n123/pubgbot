const Discord = require("discord.js");
const strats = require("./strats.json");
const ffmpeg = require("ffmpeg");
const YTDL = require("ytdl-core");
const client = new Discord.Client();
const PREFIX = "!";

function play(connection, message) {
    var server = servers[message.guild.id];

    server.dispatcher = connection.playStream(YTDL(server.queue[0], {filter: "audioonly"}));

    server.queue.shift();

    server.dispatcher.on("end", function() {
        if(server.queue[0]) play(connection, message);
        else connection.disconnect();
    });
}

var servers = {};

client.on("message", function(message) {
    if(message.author.equals(client.user)) return;
    if(!message.content.startsWith(PREFIX)) return;

    var args = message.content.substring(PREFIX.length).split(" ");

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
            message.reply(strats[strat].name + ", " + strats[strat].description);
            break;
        
        case "brexit":
            message.reply("For proof that I (Jack/in3ert) really did do brexit then go forward too www.jackdidbrexit.top");
            break;

        case "play":
            if(!args[1]) {
                message.channel.sendMessage("Please provide a link");
                return;
            }

            if(!args[1].) {
                
            }

            if(!message.member.voiceChannel) {
                message.channel.sendMessage("You must be in a voice channel");
                return;
            }

            if(!servers[message.guild.id]) servers[message.guild.id] = {
                queue: []
            }

            var server = servers[message.guild.id];

            server.queue.push(args[1]);

            if(!message.guild.voiceConnection) message.member.voiceChannel.join().then(function(connection) {
                play(connection, message);
            });
            break;

        case "skip":
            var server = servers[message.guild.id];

            if(server.dispatcher) {
                server.dispatcher.end();
                message.channel.sendMessage("The current song has been skipped by " + message.member);
            }
            break;
            
        case "stop":
            var server = servers[message.guild.id];
                
            if(message.guild.voiceConnection) message.guild.voiceConnection.disconnect();
            break;

        case "queue":
            getInfo(servers[message.guild.id].queue ,function(err, info) {
                message.channel.sendMessage("The queue is " + info.title);
            });
            break;

        default:
            message.channel.sendMessage("Invalid command");
    }
});


client.login("MzU2MDQzNzgyNzAzMjg0MjI0.DJVp0A.st-zmLNhieG7QsM6lOxc9pvd4vE");
