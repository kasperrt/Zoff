<!DOCTYPE html>
<?php
    $guid=substr(base64_encode(crc32($_SERVER['HTTP_USER_AGENT'].$_SERVER['REMOTE_ADDR'].$_SERVER['HTTP_ACCEPT_LANGUAGE'])), 0, 8);
    if(isset($_GET['chan'])) {header('Location: '.$_GET['chan']); exit;}
    $list = explode("/", htmlspecialchars(strtolower($_SERVER["REQUEST_URI"])));
    if($list[1]==""||!isset($list[1])||count($list)<=1){$list="";include('php/nochan.php');die();}
    else $list=$list[1];

?>
<html lang="en">
<head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb#">
	<?php include("php/header.php"); ?>
</head>
<body id="channelpage">
    <header>
      <div class="navbar-fixed">
        <nav id="nav">
            <div class="nav-wrapper">
                <a href="/" class="brand-logo brand-logo-navigate hide-on-med-and-down noselect">
                    <img id="zicon" src="static/images/squareicon_small.png" alt="zöff" title="Zöff" />
                </a>
                <div class="brand-logo brand-logo-navigate truncate zbrand">
                    <a href="/" class="hide-on-large-only">Zöff</a>
                    <span class="hide-on-large-only">/</span>
                    <span id="chan" class="chan clickable" title="Show big URL"><?php echo(ucfirst($list));?></span>
                </div>

                <ul class="title-container">
                    <li class="song-title truncate" id="song-title">
                        Loading...
                    </li>
                    <li class="search-container hide" id="search-wrapper">
                        <input id="search" class="search_input" type="text" title="Search for songs..." placeholder="Find song on youtube" onsubmit="null;" autocomplete="off" />
                    </li>
                </ul>

                <ul class="right control-list noselect">
                  <li id="search_loader" class="valign-wrapper hide">
                      <div class="valign">
                         <div class="preloader-wrapper small active">
                          <div class="spinner-layer spinner-blue">
                            <div class="circle-clipper left">
                              <div class="circle"></div>
                            </div><div class="gap-patch">
                              <div class="circle"></div>
                            </div><div class="circle-clipper right">
                              <div class="circle"></div>
                            </div>
                          </div>

                          <div class="spinner-layer spinner-red">
                            <div class="circle-clipper left">
                              <div class="circle"></div>
                            </div><div class="gap-patch">
                              <div class="circle"></div>
                            </div><div class="circle-clipper right">
                              <div class="circle"></div>
                            </div>
                          </div>

                          <div class="spinner-layer spinner-yellow">
                            <div class="circle-clipper left">
                              <div class="circle"></div>
                            </div><div class="gap-patch">
                              <div class="circle"></div>
                            </div><div class="circle-clipper right">
                              <div class="circle"></div>
                            </div>
                          </div>

                          <div class="spinner-layer spinner-green">
                            <div class="circle-clipper left">
                              <div class="circle"></div>
                            </div><div class="gap-patch">
                              <div class="circle"></div>
                            </div><div class="circle-clipper right">
                              <div class="circle"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      </li>
                    <li>
                        <a class="nav-btn" href="#find" id="search-btn">
                            <i class="mdi-action-search"></i>
                            <span class="hover-text">Find</span>
                        </a>
                    </li>
                    <li>
                        <a class="nav-btn" href="#skip" id="skip">
                            <i class="mdi-av-skip-next"></i>
                            <span class="hover-text">Skip</span>
                        </a>
                    </li>
                    <li>
                        <a class="nav-btn hide-on-small-only" href="#stir" id="shuffle">
                            <i class="mdi-av-shuffle"></i>
                            <span class="hover-text">Stir</span>
                        </a>
                    </li>
                    <li>
                        <a class="nav-btn hide-on-small-only" href="#chat_btn" data-activates="chat-bar" id="chat-btn">
                            <i class="tiny mdi-communication-message"></i>
                            <span class="hover-text">Chat</span>
                        </a>
                    </li>
                    <li>
                        <a class="nav-btn" href="#settings" data-activates="settings-bar" id="settings">
                            <i class="mdi-action-settings"></i>
                            <span class="hover-text">Conf</span>
                        </a>
                    </li>
                </ul>
                <ul class="side-nav" id="settings-bar">
                    <?php include("php/panel.php");?>
                </ul>
                <div id="results" class="search_results hide">
                    <div id="temp-results-container">
                      <div id="temp-results">
                          <div id="result" class="result">
                              <img class="thumb" src="/static/images/loading.png" alt="Thumb"/>

                                  <div class="search-title truncate"></div>
                                  <span class="result_info"></span>

                              <div class="waves-effect waves-orange btn-flat" id="add-many" title="Add several videos">
                                  <i class="mdi-av-playlist-add"></i>
                              </div>
                          </div>
                      </div>
                    </div>
                    <div id="empty-results-container">
                      <div id='empty-results' class='valign-wrapper'>
                        <span class='valign'>No results found..</span>
                      </div>
                    </div>
                </div>
            </div>
        </nav>
      </div>
      <div id="help" class="modal">
        <div class="modal-header-fixed">
                <a href="#!" class="modal-action modal-close waves-effect waves-green btn-flat">Close</a>
            </div>
            <div class="modal-content">
                <h4>So you need help?</h4>
                <p>When listening on a channel, there are some different buttons you can click.</p>
                <p>If you click the cogwheel, you'll open the settings panel. Here you can change channel settings, decide if you want the computer you're on can be remote-controlled, and import playlists from YouTube.</p>
                <p>The search-icon, opens up a search inputfield. If you start typing here, the site will automagically search for your input!</p>
                <p>If you click the button next to the search icon, you'll skip on a song. The one next to that one, is shuffleling of the list. Next one there again is to open the chat.</p>
                <p>Clicking a song in the playlist, gives it a vote. If you're logged in, you'll have a delete button at your disposal.</p>
                <p>Also, whenever you're logged in, you'll have two tabs in the top of the playlist thats called "Playlist" and "Suggested". The playlist obviously shows the playlist. But the suggested tab, shows 5 songs that YouTube recommends based on the current song. There might also be user recommended songs. To add any of these, just click them as you'd click a song to vote.</p>
            </div>
        </div>
    </header>
     <div id="channel-load" class="progress">
            <div class="indeterminate" id="channel-load-move"></div>
        </div>
    <main class="container center-align main">
        <div id="main-row" class="row">
            <div class="col s12 m9 video-container hide-on-small-only">

                <ul class="side-nav left-aligned chat-bar" id="chat-bar">
                    <li id="chat-log">
                        <ul class="collapsible collapsible-accordion inherit-height">
                            <li class="active inherit-height">

                                <div class="collapsible-body inherit-height" style="display: block;">
                                    <!--<ul id="chat inherit-height">-->
                                      <div class="row inherit-height">
                                        <div class="col s12">
                                          <ul class="tabs">
                                            <li class="tab col s3 chat-tab-li"><a class="active chat-tab truncate" href="#channelchat"><?php echo $list; ?></a></li>
                                            <li class="tab col s3 chat-tab-li"><a class="chat-tab" href="#all_chat">All</a></li>
                                          </ul>
                                        </div>
                                        <div id="channelchat" class="col s12 inherit-height"><ul id="chatchannel" class="inherit-height"></ul></div>
                                        <div id="all_chat" class="col s12 inherit-height"><ul id="chatall" class="inherit-height"></ul></div>
                                      </div>
                                    <!--</ul>-->
                                </div>
                            </li>
                        </ul>
                    </li>
                    <li id="chat-input">
                      <form action="#" id="chatForm" onsubmit="return false;">
                        <input id="text-chat-input" name="input" type="text" autocomplete="off" placeholder="Chat" maxlength="150" />
                      </form>
                    </li>
                </ul>
                <!--
                  width: calc(100% - 261px);
                  display: inline;
                  -->
                <div id="player" class="ytplayer"></div>
                <div id="player_overlay" class="hide valign-wrapper">
                  <div id="player_overlay_text" class="valign center-align">
                    Waiting for Video
                  </div>
                </div>
                <div id="controls" class="noselect">
                  <div id="playpause">
                    <i id="play" class="mdi-av-play-arrow hide"></i>
                    <i id="pause" class="mdi-av-pause"></i>
                  </div>
                  <div id="duration">00:00 / 00:00</div>
                  <div id="fullscreen">
                    <i class="mdi-navigation-fullscreen"></i>
                  </div>
                  <div id="volume-button">
                    <i id="v-mute" class="mdi-av-volume-off"></i>
                    <i id="v-low" class="mdi-av-volume-mute"></i>
                    <i id="v-medium" class="mdi-av-volume-down"></i>
                    <i id="v-full" class="mdi-av-volume-up"></i>
                  </div>
                  <div id="volume"></div>
                  <div id="viewers"></div>
                  <div id="bar"></div>
                </div>
            </div>
            <div id="playlist" class="col s12 m3">
              <ul class="tabs playlist-tabs hide-on-small-only hide">
                <li class="tab col s3"><a class="playlist-tab-links" href="#wrapper">Playlist</a></li>
                <li class="tab col s3"><a class="playlist-tab-links" href="#suggestions">Suggested</a></li>
              </ul>
                <div id="wrapper">
                    <div id="preloader" class="progress channel_preloader">
                        <div class="indeterminate"></div>
                    </div>
                    <div id="list-song-html">
                        <div id="list-song" class="card left-align list-song">
                            <span class="clickable vote-container" title="Vote!">
                                <a class="clickable center-align votebg">
                                    <span class="lazy card-image cardbg list-image" style="background-image:url('/static/images/loading.png');"></span>
                                </a>
                                <span class="card-content">
                                    <span class="flow-text truncate list-title"></span>
                                    <span class="vote-span">
                                        <span class="list-votes"></span>
                                        <span class="highlighted vote-text">&nbsp;votes</span>
                                    </span>
                                </span>
                            </span>
                            <div class="card-action center-align list-remove hide">
                                <a title="Remove song" id="del" class="waves-effect btn-flat clickable">Delete</a>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="suggestions" class="tabs_height hide-on-small-only">
                        <p class="suggest-title-info">YouTube Suggests:</p>
                        <div class="suggest_bar" id="suggest-song-html"> 
                        </div>  
                        <p class="suggest-title-info" id="user_suggests">Users Suggests:</p>
                        <div class="suggest_bar" id="user-suggest-html">
                        </div>
                </div>
            </div>
        </div>
        <div id="playbar">
          
        </div>
    </main>

    <?php include("php/footer.php"); ?>
    <div id="scripts">
        <script type="text/javascript" src="/static/dist/lib/jquery.lazyload.js"></script>
        <script type="text/javascript" src="/static/dist/lib/color-thief.js"></script>
        <script type="text/javascript" src="//crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/sha256.js"></script>
        <script type="text/javascript" src="//crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/aes.js"></script>
        <script type="text/javascript" src="/static/dist/main.min.js"></script>
    </div>
    </body>
</html>
