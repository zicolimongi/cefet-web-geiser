var express = require('express'),
    app = express(), fs = require('fs'), _ = require('underscore');

// carregar "banco de dados" (data/jogadores.json e data/jogosPorJogador.json)
// dica: 3-4 linhas de código (você deve usar o módulo de filesystem (fs))
var json_players = fs.readFileSync(__dirname + '/data/jogadores.json', 'utf8')
var json_games_per_player = fs.readFileSync(__dirname + '/data/jogosPorJogador.json', 'utf8')
var db = {
  "players": JSON.parse(json_players).players,
  "games_per_player": JSON.parse(json_games_per_player)
};



// configurar qual templating engine usar. Sugestão: hbs (handlebars)
app.set('view engine', 'hbs');
app.set('views', 'server/views');

// definir rota para página inicial --> renderizar a view index, usando os
// dados do banco de dados "data/jogadores.json" com a lista de jogadores
// dica: o handler desta função é bem simples - basta passar para o template
//       os dados do arquivo data/jogadores.json
app.get('/', function(request, response) {
  response.render('index',{'players': db.players});
});

// definir rota para página de detalhes de um jogador --> renderizar a view
// jogador, usando os dados do banco de dados "data/jogadores.json" e
// "data/jogosPorJogador.json", assim como alguns campos calculados
// dica: o handler desta função pode chegar a ter umas 15 linhas de código
app.get('/jogador/:numero_identificador/', function(request, response) {
  var player_steamid = request.params.numero_identificador
  player = findPlayer(player_steamid)
  player.gamesNotPlayedCount = playerGamesNotPlayed(player_steamid).length
  player.gamesCount = playerGamesCount(player_steamid)
  player.top5Games = playerFavoriteGames(player_steamid,5)
  player.favoriteGame = player.top5Games[0]
  addPlayedTimeField(player)

  response.render('jogador',{'player': player,
                             'games': db.games_per_player[player_steamid]});
});

// configurar para servir os arquivos estáticos da pasta "client"
// dica: 1 linha de código
app.use(express.static(__dirname + '/../client'))

// abrir servidor
// dica: 1-3 linhas de código
var server = app.listen(3000, function(){})


function findPlayer(steamid){
  return _.find(db.players,function(el){
    return el.steamid === steamid
  })
};

function playerGamesCount(steamid){
  return db.games_per_player[steamid].game_count
}

function playerGamesNotPlayed(steamid){
  return _.where(db.games_per_player[steamid].games, { playtime_forever: 0 })
}

function playerGamesOrderedByPlayedTime(steamid){
  return _.sortBy(db.games_per_player[steamid].games, function(el) { return -el.playtime_forever; });
}

function playerFavoriteGames(steamid,limit){
  return _.first(playerGamesOrderedByPlayedTime(steamid),limit)
}


function addPlayedTimeField(player){
  player.favoriteGame.played_time = (player.favoriteGame.playtime_forever / 60).toFixed(1)
  for(i in player.top5Games){
    player.top5Games[i].played_time = (player.top5Games[i].playtime_forever / 60).toFixed(1)
  }
}
