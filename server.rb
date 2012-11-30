require 'sinatra'
require 'sinatra-websocket'
require 'twitter/json_stream'
require 'json'

KEY    = "自分の"
SEC    = "自分の"
TOKEN  = "自分の"
TSEC   = "自分の"

CONF = Hash.new
CONF[:host] = "userstream.twitter.com"
CONF[:path] = "/1.1/statuses/filter.json?track=%23animation_twitter"
CONF[:oauth] = Hash.new
CONF[:oauth][:consumer_key]    = KEY
CONF[:oauth][:consumer_secret] = SEC
CONF[:oauth][:access_key]      = TOKEN
CONF[:oauth][:access_secret]   = TSEC


set :server, 'thin'
set :sockets, []
set :public_folder, File.dirname(__FILE__) + '/static'
#set :port,1234 

#つぶやきとscreen_nameの区切りのため
pase = "|" * 141

get '/' do
    if !request.websocket?
        erb :index 
    else
        request.websocket do |ws|
            ws.onopen do
                settings.sockets << ws
            end
            ws.onmessage do |msg|
                puts msg
                EM.next_tick { settings.sockets.each{|s| s.send(msg) } }
            end
            ws.onclose do
                settings.sockets.delete(ws)
            end

            EventMachine::run do 
                stream = Twitter::JSONStream.connect(CONF)
                stream.each_item do |item|
                    @tweet = JSON.parse(item)
                    @user = @tweet['user']
                    next if @user.class == NilClass #NilClassだったら最初の変なやつ(IDが入ってるHash)

                    ws.send(@tweet['text'] + pase + @user['screen_name'])
                end
            end

        end
    end
end
