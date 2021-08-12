var OV;
var session;

var sessionName;
var nickname;
var token;
var numVideos = 0;

// 민영 수정
var connectionId;
var uRecordUrl;
var forceRecordingId;
var userJson;
var userList = [];
var nickname;

// 호근 수정 시작 : 음소거
var publisher;
var publishAudio = false;
var publishVideo = true;

function muteAudio() {
	console.log("muteAudio")
	publishAudio = !publishAudio
	document.getElementById('muteAudioBtn').value = publishAudio ? "mute audio" : "unmute audio"
	publisher.publishAudio(publishAudio)
}

function muteVideo() {
	console.log("muteVideo")
	publishVideo = !publishVideo
	document.getElementById('muteVideoBtn').value = publishVideo ? "mute video" : "unmute video"
	publisher.publishVideo(publishVideo)
}
// 호근 수정 끝 : 음소거

// 호근 수정 시작 : session id

window.addEventListener("message", (event) => {
	$('#sessionName').val(event.data.sessionName)
	$('#sessionName').attr('disabled', true)
	$('#nickname').val(event.data.nickname)
	// 민영 수정 시작
	nickname = event.data.nickname;
	console.log("nickname: " + nickname);
	// 민영 수정 끝
	$('#nickname').attr('disabled', true)
}, false)

// 호근 수정 끝 : session id

/* OPENVIDU METHODS */

function joinSession() {

	// --- 0) Change the button ---
		
	document.getElementById("join-btn").disabled = true;
	document.getElementById("join-btn").innerHTML = "Joining...";

	getToken(function () {

		// --- 1) Get an OpenVidu object ---

		OV = new OpenVidu();

		// --- 2) Init a session ---

		session = OV.initSession();

		// --- 3) Specify the actions when events take place in the session ---

		session.on('connectionCreated', event => {
			pushEvent(event);
			// 민영 수정 시작
			console.log(event.connection.connectionId);
			connectionId = !connectionId ? event.connection.connectionId : connectionId;
			// connectionId = event.connection.connectionId;
			let userInfo = [connectionId, nickname];
			userList.push(userInfo);
			// 민영 수정 끝
		});

		session.on('connectionDestroyed', event => {
			pushEvent(event);
		});

		// On every new Stream received...
		session.on('streamCreated', event => {
			pushEvent(event);

			// Subscribe to the Stream to receive it
			// HTML video will be appended to element with 'video-container' id
			var subscriber = session.subscribe(event.stream, 'video-container');

			// When the HTML video has been appended to DOM...
			subscriber.on('videoElementCreated', event => {
				pushEvent(event);
				// Add a new HTML element for the user's name and nickname over its video
				updateNumVideos(1);
			});

			// When the HTML video has been appended to DOM...
			subscriber.on('videoElementDestroyed', event => {
				pushEvent(event);
				// Add a new HTML element for the user's name and nickname over its video
				updateNumVideos(-1);
			});

			// When the subscriber stream has started playing media...
			subscriber.on('streamPlaying', event => {
				pushEvent(event);
			});
		});

		session.on('streamDestroyed', event => {
			pushEvent(event);
		});

		session.on('sessionDisconnected', event => {
			pushEvent(event);
			if (event.reason !== 'disconnect') {
				removeUser();
			}
			if (event.reason !== 'sessionClosedByServer') {
				session = null;
				numVideos = 0;
				$('#join').show();
				$('#session').hide();
			}
		});

		session.on('recordingStarted', event => {
			pushEvent(event);
		});

		session.on('recordingStopped', event => {
			pushEvent(event);
		});

		// On every asynchronous exception...
		session.on('exception', (exception) => {
			console.warn(exception);
		});

		// --- 4) Connect to the session passing the retrieved token and some more data from
		//        the client (in this case a JSON with the nickname chosen by the user) ---

		session.connect(token)
			.then(() => {

				// --- 5) Set page layout for active call ---

				$('#session-title').text(sessionName);
				$('#join').hide();
				$('#session').show();

				// --- 6) Get your own camera stream ---

				publisher = OV.initPublisher('video-container', {
					audioSource: undefined, // The source of audio. If undefined default microphone
					videoSource: undefined, // The source of video. If undefined default webcam
					publishAudio: publishAudio, // Whether you want to start publishing with your audio unmuted or not
					publishVideo: publishVideo, // Whether you want to start publishing with your video enabled or not
					resolution: '640x480', // The resolution of your video
					frameRate: 30, // The frame rate of your video
					insertMode: 'APPEND', // How the video is inserted in the target element 'video-container'
					mirror: false // Whether to mirror your local video or not
				});

				// --- 7) Specify the actions when events take place in our publisher ---

				// When the publisher stream has started playing media...
				publisher.on('accessAllowed', event => {
					pushEvent({
						type: 'accessAllowed'
					});
				});

				publisher.on('accessDenied', event => {
					pushEvent(event);
				});

				publisher.on('accessDialogOpened', event => {
					pushEvent({
						type: 'accessDialogOpened'
					});
				});

				publisher.on('accessDialogClosed', event => {
					pushEvent({
						type: 'accessDialogClosed'
					});
				});

				// When the publisher stream has started playing media...
				publisher.on('streamCreated', event => {
					pushEvent(event);
					console.log("publisher: start recording");
					startRecording();
				});

				// When our HTML video has been added to DOM...
				publisher.on('videoElementCreated', event => {
					pushEvent(event);
					updateNumVideos(1);
					$(event.element).prop('muted', true); // Mute local video
				});

				// When the HTML video has been appended to DOM...
				publisher.on('videoElementDestroyed', event => {
					pushEvent(event);
					// Add a new HTML element for the user's name and nickname over its video
					updateNumVideos(-1);
				});

				// When the publisher stream has started playing media...
				publisher.on('streamPlaying', event => {
					pushEvent(event);
				});

				// --- 8) Publish your stream ---

				session.publish(publisher);

				console.log(publisher);

			})
			.catch(error => {
				console.warn('There was an error connecting to the session:', error.code, error.message);
				enableBtn();
			});

		return false;
	});

}

function leaveSession() {

	// --- 9) Leave the session by calling 'disconnect' method over the Session object ---
	session.disconnect();
	// enableBtn();
	window.close();
}

/* OPENVIDU METHODS */

function enableBtn (){
	document.getElementById("join-btn").disabled = false;
	document.getElementById("join-btn").innerHTML = "Join!";
}

/* APPLICATION REST METHODS */

function getToken(callback) {
	sessionName = $("#sessionName").val(); // Video-call chosen by the user

	httpRequest(
		'POST',
		'api/get-token', {
			sessionName: sessionName
		},
		'Request of TOKEN gone WRONG:',
		res => {
			token = res[0]; // Get token from response
			console.warn('Request of TOKEN gone WELL (TOKEN:' + token + ')');
			callback(token); // Continue the join operation
		}
	);
}

function removeUser() {
	httpRequest(
		'POST',
		'api/remove-user', {
			sessionName: sessionName,
			token: token
		},
		'User couldn\'t be removed from session',
		res => {
			console.warn("You have been removed from session " + sessionName);
		}
	);
}

function closeSession() {

	stopRecording(publisher.connectionId);

	httpRequest(
		'DELETE',
		'api/close-session', {
			sessionName: sessionName
		},
		'Session couldn\'t be closed',
		res => {
			console.warn("Session " + sessionName + " has been closed");
		}
	);

	leaveSession();
}

function fetchInfo() {
	httpRequest(
		'POST',
		'api/fetch-info', {
			sessionName: sessionName
		},
		'Session couldn\'t be fetched',
		res => {
			console.warn("Session info has been fetched");
			// $('#textarea-http').text(JSON.stringify(res, null, "\t"));
		}
	);
}

function fetchAll() {
	httpRequest(
		'GET',
		'api/fetch-all', {},
		'All session info couldn\'t be fetched',
		res => {
			console.warn("All session info has been fetched");
			// $('#textarea-http').text(JSON.stringify(res, null, "\t"));
		}
	);
}

function forceDisconnect() {
	httpRequest(
		'DELETE',
		'api/force-disconnect', {
			sessionName: sessionName,
			connectionId: document.getElementById('forceValue').value
		},
		'Connection couldn\'t be closed',
		res => {
			console.warn("Connection has been closed");
		}
	);
}

function forceUnpublish() {
	httpRequest(
		'DELETE',
		'api/force-unpublish', {
			sessionName: sessionName,
			streamId: document.getElementById('forceValue').value
		},
		'Stream couldn\'t be closed',
		res => {
			console.warn("Stream has been closed");
		}
	);
}

function httpRequest(method, url, body, errorMsg, callback) {
	// $('#textarea-http').text('');
	var http = new XMLHttpRequest();
	http.open(method, url, true);
	http.setRequestHeader('Content-type', 'application/json');
	http.addEventListener('readystatechange', processRequest, false);
	http.send(JSON.stringify(body));

	function processRequest() {
		if (http.readyState == 4) {
			if (http.status == 200) {
				try {
					callback(JSON.parse(http.responseText));
				} catch (e) {
					callback(e);
				}
			} else {
				console.warn(errorMsg + ' (' + http.status + ')');
				console.warn(http.responseText);
				// $('#textarea-http').text(errorMsg + ": HTTP " + http.status + " (" + http.responseText + ")");
			}
		}
	}
}

function startRecording() {
	// var outputMode = $('input[name=outputMode]:checked').val();
	var hasAudio = $('#has-audio-checkbox').prop('checked');
	var hasVideo = $('#has-video-checkbox').prop('checked');
	httpRequest(
		'POST',
		'api/recording/start', {
			session: session.sessionId,
			outputMode: "INDIVIDUAL",	// 민영 수정
			hasAudio: hasAudio,
			hasVideo: hasVideo
		},
		'Start recording WRONG',
		res => {
			console.log(res);
			document.getElementById('forceRecordingId').value = res.id;
			forceRecordingId = res.id;	// 민영 수정
			checkBtnsRecordings();
			// $('#textarea-http').text(JSON.stringify(res, null, "\t"));
		}
	);
}

function stopRecording(param) {
	// var forceRecordingId = document.getElementById('forceRecordingId').value;
	userJson = JSON.stringify(userList);
	httpRequest(
		'POST',
		'api/recording/stop', {
			recording: forceRecordingId,
			connectionId: param, // 민영 수정
			userJson:  userJson // 민영 수정
		},
		'Stop recording WRONG',
		res => {
			console.log(res);
			// $('#textarea-http').text(JSON.stringify(res, null, "\t"));

			// 민영 수정
			uRecordUrl = res.url;
			console.log(uRecordUrl);
			// 녹화본 정보 가져온 후 바로 recording zip 파일 삭제
			// > 지우지마! 지우면 url 접근 불가, 내 생각에는 사용자가 직접 영상 삭제하기
			// deleteRecording();
		}
	);
}

/*
function deleteRecording() {
	var forceRecordingId = document.getElementById('forceRecordingId').value;
	httpRequest(
		'DELETE',
		'api/recording/delete', {
			recording: forceRecordingId
		},
		'Delete recording WRONG',
		res => {
			console.log("DELETE ok");
			// $('#textarea-http').text("DELETE ok");
		}
	);
}
*/

/*
function getRecording() {
	var forceRecordingId = document.getElementById('forceRecordingId').value;
	httpRequest(
		'GET',
		'api/recording/get/' + forceRecordingId, {},
		'Get recording WRONG',
		res => {
			console.log(res);
			// $('#textarea-http').text(JSON.stringify(res, null, "\t"));
		}
	);
}
*/

/*
function listRecordings() {
	httpRequest(
		'GET',
		'api/recording/list', {},
		'List recordings WRONG',
		res => {
			console.log(res);
			// $('#textarea-http').text(JSON.stringify(res, null, "\t"));
		}
	);
}
*/

/* APPLICATION REST METHODS */



/* APPLICATION BROWSER METHODS */

events = '';

window.onbeforeunload = function () { // Gracefully leave session
	if (session) {
		removeUser();
		leaveSession();
	}
}

// 호근 수정 시작 : 비디오 그리드

function updateNumVideos(i) {
	numVideos += i;

	const colNum = Math.ceil(Math.sqrt(numVideos));
	// const rowNum = Math.ceil(numVideos / colNum);

	// const maxWidth = parseInt(100 / colNum)
	// const maxHeight = parseInt(100 / rowNum)

	// $('video').attr('width', `${window.innerWidth}px`)
	// $('video').attr('height', `${window.innerHeight}px`)

	// $('video').css('aspect-ratio', `4/3`)

	// $('video').css('max-width', `calc(${maxWidth}vw - ${10 * (colNum - 1)}px)`)
	// $('video').css('max-height', `calc(${maxHeight}vh - ${10 * (rowNum - 1)}px)`)

	$('#video-container').css('grid-template-columns', `repeat(${colNum}, 1fr)`)
}

// 호근 수정 끝 : 비디오 그리드

function checkBtnsForce() {
	if (document.getElementById("forceValue").value === "") {
		document.getElementById('buttonForceUnpublish').disabled = true;
		document.getElementById('buttonForceDisconnect').disabled = true;
	} else {
		document.getElementById('buttonForceUnpublish').disabled = false;
		document.getElementById('buttonForceDisconnect').disabled = false;
	}
}

function checkBtnsRecordings() {
	if (forceRecordingId === "") {
	// if (document.getElementById("forceRecordingId").value === "") {
		// document.getElementById('buttonGetRecording').disabled = true;
		document.getElementById('buttonStopRecording').disabled = true;
		// document.getElementById('buttonDeleteRecording').disabled = true;
	} else {
		// document.getElementById('buttonGetRecording').disabled = false;
		document.getElementById('buttonStopRecording').disabled = false;
		// document.getElementById('buttonDeleteRecording').disabled = false;
	}
}

function pushEvent(event) {
	events += (!events ? '' : '\n') + event.type;
	// $('#textarea-events').text(events);
}

function clearHttpTextarea() {
	// $('#textarea-http').text('');
}

function clearEventsTextarea() {
	// $('#textarea-events').text('');
	events = '';
}

/* APPLICATION BROWSER METHODS */



/* upzip */
/*
let zip_url = 'http://localhost/a.zip';
let promise = new JSZip.external.Promise(function (resolve, reject) {
		JSZipUtils.getBinaryContent(zip_url, function(err, data) {
				if (err) {
						reject(err);
				} else {
						resolve(data);
				}
		});
});
promise.then(JSZip.loadAsync).then(
		function (zip) {
				zip.forEach(function (fileName) {
						let file = zip.file(fileName);
						// 압축 파일 안에 저장된 파일이 압축이 풀리고 ArrayBuffer 타입으로 전달됨
						file.async("arraybuffer").then(
								function success(buf) {
										alert(fileName);
								},
								function error(e) {
										// 에러가 나셨습니다.
								}
						);
				});
		}
);
*/

