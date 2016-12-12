<!DOCTYPE html>
<html lang="en">
<head prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb#">
    <?php include("header.php"); ?>
    <link rel="chrome-webstore-item" href="https://chrome.google.com/webstore/detail/jemjlblambcgjmmhheaklfnphncdmfmb" />
</head>
<body class="noselect cursor-default">
    <header>
        <nav id="fp-nav">
            <div class="nav-wrapper">
                <a href="//zoff.no" class="brand-logo hide-on-small-only">
                    <img id="zicon" src="/public/images/squareicon_small.png" alt="zöff" title="Zöff" />
                </a>
                <a href="//zoff.no" class="brand-logo hide-on-med-and-up">Zöff</a>
                <ul id="nav-mobile" class="right hide-on-med-and-down">
                  <li><a class="modal-trigger waves-effect waves-red" title="Need help with the site?" onclick="$('#help').openModal()">Help</a></li>
                  <li><a class="waves-effect green" title="Remote control a Zöff player" href="https://remote.zoff.no">Remote</a></li>
                  <li><a class="modal-trigger waves-effect waves-orange" onclick="$('#about').openModal()">About</a></li>
                  <li><a class="modal-trigger waves-effect waves-yellow" onclick="$('#legal').openModal()">Legal</a></li>
                  <li><a class="waves-effect waves-purple" href="https://github.com/zoff-music/">GitHub</a></li>
                </ul>
            </div>
        </nav>
        <div id="legal" class="modal">
            <div class="modal-content">
                <h4>Legal</h4>
                <p>Copyright © 2015 <br>Nicolas Almagro Tonne and Kasper Rynning-Tønnesen
                <br><br>
                Creative Commons License<br>
                Zöff is licensed under a <br><a href="http://creativecommons.org/licenses/by-nc-nd/3.0/no/">Creative Commons Attribution-NonCommercial-NoDerivs 3.0 Norway License.</a>
                <br>
                Do not redistribute without permission from the developers.
                <br>
            </div>
            <div class="modal-footer">
                <a href="#!" class=" modal-action modal-close waves-effect waves-green btn-flat">Close</a>
            </div>
        </div>
        <div id="about" class="modal">
            <div class="modal-content">
                <h4>About</h4>
                <p>Zöff is a shared (free) YouTube based radio service, built upon the YouTube API. <br><br>
                Zöff is mainly a webbased service. The website uses <a href="https://nodejs.org/">NodeJS</a> with <a href="http://socket.io/">Socket.IO</a>, <a href="https://www.mongodb.org/">MongoDB</a> and PHP on the backend, with JavaScript, jQuery and <a href="http://materializecss.com/">Materialize</a> on the frontend. More about the project itself can be found on <a href="https://github.com/zoff-music/Zoff">GitHub</a><br><br>
                The team consists of Kasper Rynning-Tønnesen and Nicolas Almagro Tonne, and the project has been worked on since late 2014.<br><br>
                The team can be reached on <a href="mailto:contact@zoff.no?Subject=Contact%20Zoff">contact@zoff.no</a>
                </p>
            </div>
            <div class="modal-footer">
                <a href="#!" class=" modal-action modal-close waves-effect waves-green btn-flat">Close</a>
            </div>
        </div>
        <div id="help" class="modal">
            <div class="modal-content">
                <h4>So you need help?</h4>
                <p>To remote-controll a computer, just type in the ID for that computer. (This can be found in the settings panel on the computer you want to remote controll. There is also a QR code for you to scan.</p>
                <p>When you've entered the ID for the computer you want to controll, you'll be able to change the volume, have the controlled computer vote for skipping, pause the video or play the video.</p>
                <p>The inputfield you used to enter the ID (if you entered it), has now changed some. If you type in something here now, the controlled computer will change channel!</p>
            </div>
            <div class="modal-footer">
                <a href="#!" class=" modal-action modal-close waves-effect waves-green btn-flat">Close</a>
            </div>
        </div>
    </header>

    <main class="center-align container remote-container">
    <div class="section">
    <h3 id="remote-text">Twitch Bot</h3>
    <div class="row">
        <div class="col s6">
            <p>
                Commands
            </p>
            <p>
                join
            </p>
            <p>
                leave
            </p>
            <p>
                np
            </p>
        </div>
        <div class="col s6">Sign up</div>
    </div>
    </div>
    </main>

    <?php include("footer.php"); ?>

    <script type="text/javascript" src="//cdnjs.cloudflare.com/ajax/libs/jqueryui-touch-punch/0.2.3/jquery.ui.touch-punch.min.js"></script>
    <!--<script type="text/javascript" src="/public/dist/remote.min.js"></script>-->
	</body>
</html>
