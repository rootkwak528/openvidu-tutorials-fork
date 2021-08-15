// 호근 수정 시작 : axios
// const axios = require('axios');
// 호근 수정 끝 : axios

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
var streamId;

// 민영 호근 수정 시작 : 음소거
var publisher;
var publishAudio = false;
var publishVideo = true;
var isAudioMute = false;
var isVideoMute = false;

function muteAudio() {
	publishAudio = !publishAudio
	publisher.publishAudio(publishAudio)

  if(isAudioMute == true) {
    isAudioMute = false;
    document.getElementById("muteAudioBtn").innerHTML = `<i class="fas fa-microphone fa-2x"></i>`;
    document.getElementById("muteAudioBtn").style.backgroundColor = "#e8e8e8";
    document.getElementById("muteAudioBtn2").innerHTML = `<i class="fas fa-microphone fa-2x"></i>`;
    document.getElementById("muteAudioBtn2").style.backgroundColor = "#e8e8e8";
  } else {
    isAudioMute = true;
    document.getElementById("muteAudioBtn").innerHTML = `<i class="fas fa-microphone-slash fa-2x"></i>`;
    document.getElementById("muteAudioBtn").style.backgroundColor = "#f35747";
    document.getElementById("muteAudioBtn2").innerHTML = `<i class="fas fa-microphone-slash fa-2x"></i>`;
    document.getElementById("muteAudioBtn2").style.backgroundColor = "#f35747";
  }
}

function muteVideo() {
	publishVideo = !publishVideo
	publisher.publishVideo(publishVideo)

  if(isVideoMute == true) {
    isVideoMute = false;
    document.getElementById("muteVideoBtn").innerHTML = `<i class="fas fa-video fa-2x"></i>`;
    document.getElementById("muteVideoBtn").style.backgroundColor = "#e8e8e8";
    document.getElementById("muteVideoBtn2").innerHTML = `<i class="fas fa-video fa-2x"></i>`;
    document.getElementById("muteVideoBtn2").style.backgroundColor = "#e8e8e8";
  } else {
    isVideoMute = true;document.getElementById("muteVideoBtn").innerHTML = `<i class="fas fa-video-slash fa-2x"></i>`;
    document.getElementById("muteVideoBtn").style.backgroundColor = "#6cd8d7";
    isVideoMute = true;document.getElementById("muteVideoBtn2").innerHTML = `<i class="fas fa-video-slash fa-2x"></i>`;
    document.getElementById("muteVideoBtn2").style.backgroundColor = "#6cd8d7";
  }
}

// 민영 호근 수정 끝 : 음소거

// 민영 호근 수정 시작 : session id

let isTrainer
let classTitle
let classNo

window.addEventListener("message", (event) => {
	// 버튼 변경
	$('#sessionName').val(event.data.sessionName)
	$('#sessionName').attr('disabled', true)
	$('#nickname').val(event.data.nickname)
	$('#nickname').attr('disabled', true)
	document.getElementById("join-btn").disabled = false;

	sessionName = event.data.sessionName;
	nickname = event.data.nickname;
	isTrainer = event.data.isTrainer;
	classTitle = event.data.classTitle;
	classNo = event.data.classNo;
	
	document.getElementById('classname').innerText = classTitle
}, false)

// 민영 호근 수정 끝 : session id

// 민영 호근 수정 시작 : close

function onClose() {
	if (isTrainer) {
		closeSession()
	} else {
		leaveSession()
	}
}

// 민영 호근 수정 끝 : close

// 호근 수정 시작 : video grid

let colNum = 1;
let videoHighlight = false;
let focusNum = 0;

// 호근 수정 끝 : video grid

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
			sessionId = event.target.sessionId;
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

			// 닉네임 표시할 때 봐
			// When the HTML video has been appended to DOM...
			subscriber.on('videoElementCreated', event => {
				pushEvent(event);
				// Add a new HTML element for the user's name and nickname over its video
				updateNumVideos(1);
				// 민영 수정
				// appendNickname(event.element, subscriber.stream.connection.data.split("%/%")[0]);
				appendNickname(event.element, subscriber.stream.connection);
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
			removeUserData(event.stream.connection);
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
			alert('세션이 종료되었습니다.')
			// window.close();
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

		session.connect(token, nickname)
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

					// 호근 민영 수정: 트레이너만 녹화 시작
					if (isTrainer) {
						startRecording();
					}
					// 민영 수정 시작: DB로 사용자 videoURL 보내기
					//streamId = event.stream.streamId;

					// let userInfo = [nickname, sessionId, connectionId, streamId];
					// userList.push(userInfo);
					// sendUserInfo();
					sendURL();
					// 민영 수정 끝: DB로 사용자 videoURL 보내기
				});

				// When our HTML video has been added to DOM...
				publisher.on('videoElementCreated', event => {
					pushEvent(event);
					updateNumVideos(1);
					$(event.element).prop('muted', true); // Mute local video
					// 민영 수정
					appendNickname(event.element, nickname);
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

				// 호근 수정 join-dialogue 숨기기 & 비디오 관련 버튼들 보이기
				document.getElementById('join-container').classList.toggle('d-flex')
				document.getElementById('join-container').style.display = 'none'
				document.getElementById('header').style.display = 'block'
				document.getElementById('settings').style.display = 'block'

			})
			.catch(error => {
				console.warn('There was an error connecting to the session:', error.code, error.message);
				enableBtn();
			});

		return false;
	});

}

function leaveSession() {

	console.log("leaveSession func");

	// --- 9) Leave the session by calling 'disconnect' method over the Session object ---
	session.disconnect();
	enableBtn();
	// window.close();
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

function appendNickname(videoElement, connection) {
	var userData;
	var nodeId;
	if (typeof connection === "string") {
		userData = connection;
		nodeId = connection;
	} else {
		console.log(connection);
		console.log(connection.data);
		console.log("appendNickname - connectionId: " + connection.connectionId);
		// console.log(JSON.parse(connection.data));

		console.log("connection.data.split...: " + connection.data.split("%/%")[0]);
		userData = connection.data.split("%/%")[0];
		nodeId = connection.connectionId;
	}
	var dataNode = document.createElement('div');
	dataNode.className = "data-node";
	dataNode.id = "data-" + nodeId;
	// dataNode.id = "data-" + userData;
	dataNode.innerHTML = "<p>" + userData + "</p>";
	videoElement.parentNode.insertBefore(dataNode, videoElement.nextSibling);
	// addClickListener(videoElement, userData);
} 

function removeUserData(connection) {
	console.log(connection.connectionId);
	var dataNode = document.getElementById("data-" + connection.connectionId);
	dataNode.parentNode.removeChild(dataNode);
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
	console.log("closeSession func");

	// stopRecording(publisher.connection.connectionId);
	stopRecording();

	console.log(sessionName);

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

	window.close();
	// leaveSession();
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




/* 민영 수정 시작: DB로 url 보내기 */

// function sendUserInfo() {
// 	httpRequest(
// 		'POST',
// 		'api/sendUserInfo', {	// 어디로 보낼지 경로 미정
// 			sessionName: sessionName,	// 클래스 구분용 세션네임
// 			nickname: nickname,				// 사용자 구분용 닉네임
// 			videoUrl: "https://i5a204.p.ssafy.io/openvidu/recordings/" + sessionId + "/" + streamName + ".webm"	// 영상 url
// 		},
// 		'오류 메시지',
// 		res => {›
// 			console.warn("Session info has been fetched");
// 			// $('#textarea-http').text(JSON.stringify(res, null, "\t"));
// 		}
// 	);
// }


function sendURL() {
	// url 형식: https://i5a204.p.ssafy.io/openvidu/recordings/ses_DDO5OKxePI/str_CAM_E64m_con_TfgYxSzkPB.webm
	axios ({
		url: '/v1/class/video/' + classNo,
		baseURL: 'http://localhost:8080/',
		method: 'post',
		headers: {
			Authorization: "Bearer " + localStorage.getItem("jwt-auth-token")
		},
		data: {
			// nickname: nickname,
			videoUrl: 'https://i5a204.p.ssafy.io/openvidu/recordings/' + sessionId + '/' + streamId + '.webm',
		}
	})
	.then (res => {
		console.log("Success: send url to DB");
		console.log(res)
	})
	.catch (err => {
		console.log("Fail: send url to DB");
	})
}

/* 민영 수정 끝: DB로 url 보내기 */


function startRecording() {
	// var outputMode = $('input[name=outputMode]:checked').val();

	httpRequest(
		'POST',
		'api/recording/start', {
			session: session.sessionId,
			outputMode: "INDIVIDUAL",	// 민영 수정
			hasAudio: true,
			hasVideo: true
		},
		'Start recording WRONG',
		res => {
			console.log(res);
			// document.getElementById('forceRecordingId').value = res.id;
			forceRecordingId = res.id;	// 민영 수정
			console.log("forceRecordingId: " + forceRecordingId);
			// checkBtnsRecordings();
			// $('#textarea-http').text(JSON.stringify(res, null, "\t"));

		}
	);
}

function stopRecording() {
	// var forceRecordingId = document.getElementById('forceRecordingId').value;
	userJson = JSON.stringify(userList);
	console.log(userJson);
	console.log("forceRecordingId: " + forceRecordingId);
	httpRequest(
		'POST',
		'api/recording/stop', {
			recording: sessionId,
			connectionId: connectionId, // 민영 수정
			// userList: userList // 민영 수정
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
	const participantDOM = document.getElementById('participants')
	participantDOM.innerHTML = `<i class="fas fa-users" id="participants">&nbsp&nbsp${numVideos}</i>`

	const winWidth = window.innerWidth
	const winHeight = window.innerHeight

	let rowNum = Math.ceil(numVideos / colNum)
	let videoSizeX = (winWidth - 10 * (colNum - 1)) / colNum
	let totalHeight = rowNum * videoSizeX * 3 / 4 + 10 * (rowNum - 1)

	while (totalHeight > winHeight) {
		colNum += 1
		rowNum = Math.ceil(numVideos / colNum)
		videoSizeX = (winWidth - 10 * (colNum - 1)) / colNum
		totalHeight = rowNum * videoSizeX * 3 / 4 + 10 * (rowNum - 1)
	}

	if (numVideos == 1) {
		colNum = 1
	}

	$('#video-container').css('grid-template-columns', `repeat(${colNum}, 1fr)`)

	// DB에 참여 인원 업데이트
	// axios({
	// 	url: 'https://i5a204.p.ssafy.io:8080/api'
	// })
}

window.onresize = function (event) {
	colNum = 1

	const winWidth = window.innerWidth
	const winHeight = window.innerHeight

	let rowNum = Math.ceil(numVideos / colNum)
	let videoSizeX = (winWidth - 10 * (colNum - 1)) / colNum
	let totalHeight = rowNum * videoSizeX * 3 / 4 + 10 * (rowNum - 1)

	while (totalHeight > winHeight) {
		colNum += 1
		rowNum = Math.ceil(numVideos / colNum)
		videoSizeX = (winWidth - 10 * (colNum - 1)) / colNum
		totalHeight = rowNum * videoSizeX * 3 / 4 + 10 * (rowNum - 1)
	}

	if (numVideos == 1) {
		colNum = 1
	}

	$('#video-container').css('grid-template-columns', `repeat(${colNum}, 1fr)`)
}

$('video').dblclick(function (event) {
	console.log(event.target)
})

// 더블클릭하면 커지기

window.ondblclick = function (event) {
	if (event.target.tagName == 'VIDEO') {
		ondblclickVideo(event.target)
	}
}

function ondblclickVideo(target) {
	containerDOM = document.getElementById('video-container')
	containerFocusDOM = document.getElementById('video-focus-inner-container')
	
	// 타겟 비디오가 하이라이트 비디오라면,
		// 하이라이트 비디오 일반 비디오로 옮기기
	// 타겟 비디오가 일반 비디오라면,
		// 하이라이트 비디오가 이미 있다면,
			// 하이라이트 비디오 일반 비디오로 옮기기
		// 타겟 비디오 하이라이트 비디오로 옮기기

	if (target.classList.contains('focus')) {
		focusNum -= 1
		const oldChild = containerFocusDOM.removeChild(target)
		const newChild = containerDOM.appendChild(oldChild)
		newChild.classList.toggle('focus')
		containerFocusDOM.style.gridTemplateColumns = '1fr '.repeat(focusNum)

		if (!focusNum) {
			containerFocusDOM.style.height = '0'
			containerDOM.classList.toggle('horizontal-scroll')
			$('video').css('width', '100%')
		}

	} else if (focusNum < 2) {
		focusNum += 1
		const oldChild = containerDOM.removeChild(target)
		const newChild = containerFocusDOM.appendChild(oldChild)
		newChild.classList.toggle('focus')
		containerFocusDOM.style.gridTemplateColumns = '1fr '.repeat(focusNum)

		containerFocusDOM.style.height = '65vh'

		if (focusNum == 1) {
			containerDOM.classList.toggle('horizontal-scroll')
			$('video').css('width', 'auto')
		}

	} else if (focusNum == 2) {
		console.log('impossible')
	}
}

// 호근 수정 끝 : 비디오 그리드


/* 민영 수정 시작: 필요없는 함수들 주석 */
function checkBtnsForce() {
	if (document.getElementById("forceValue").value === "") {
		// document.getElementById('buttonForceUnpublish').disabled = true;
		// document.getElementById('buttonForceDisconnect').disabled = true;
	} else {
		// document.getElementById('buttonForceUnpublish').disabled = false;
		// document.getElementById('buttonForceDisconnect').disabled = false;
	}
}

function checkBtnsRecordings() {
	if (forceRecordingId === "") {
	// if (document.getElementById("forceRecordingId").value === "") {
		// document.getElementById('buttonGetRecording').disabled = true;
		// document.getElementById('buttonStopRecording').disabled = true;
		// document.getElementById('buttonDeleteRecording').disabled = true;
	} else {
		// document.getElementById('buttonGetRecording').disabled = false;
		// document.getElementById('buttonStopRecording').disabled = false;
		// document.getElementById('buttonDeleteRecording').disabled = false;
	}
}
/* 민영 수정 끝: 필요없는 함수들 주석 */


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

