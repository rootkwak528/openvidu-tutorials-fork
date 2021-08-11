package io.openvidu.recording.java;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// json
import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonElement;
import com.google.gson.stream.JsonReader;
import java.io.FileReader;
// import java.io.FileNotFoundException;
import java.util.Map;
import java.util.Set;

import io.openvidu.java.client.ConnectionProperties;
import io.openvidu.java.client.ConnectionType;
import io.openvidu.java.client.OpenVidu;
import io.openvidu.java.client.OpenViduHttpException;
import io.openvidu.java.client.OpenViduJavaClientException;
import io.openvidu.java.client.OpenViduRole;
import io.openvidu.java.client.Recording;
import io.openvidu.java.client.RecordingProperties;
import io.openvidu.java.client.Session;

// unzip
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URI;
import java.net.URL;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;


@RestController
public class MyRestRoomCreater {

	// OpenVidu object as entrypoint of the SDK
	private OpenVidu openVidu;

	// Collection to pair session names and OpenVidu Session objects
	private Map<String, Session> mapSessions = new ConcurrentHashMap<>();
	// Collection to pair session names and tokens (the inner Map pairs tokens and
	// role associated)
	private Map<String, Map<String, OpenViduRole>> mapSessionNamesTokens = new ConcurrentHashMap<>();
	// Collection to pair session names and recording objects
	private Map<String, Boolean> sessionRecordings = new ConcurrentHashMap<>();

	// URL where our OpenVidu server is listening
	private String OPENVIDU_URL;
	// Secret shared with our OpenVidu server
	private String SECRET;

	// json 사용을 위한 gson 선언
	// Gson gson = new Gson();
	
	// room 생성 시 정보
	String sName, nName;
	
	public MyRestRoomCreater(@Value("${openvidu.secret}") String secret, @Value("${openvidu.url}") String openviduUrl) {
		this.SECRET = secret;
		this.OPENVIDU_URL = openviduUrl;
		this.openVidu = new OpenVidu(OPENVIDU_URL, SECRET);
	}

	/*******************/
	/*** Create Room ***/
	/*******************/
	// https://i5a204.p.ssafy.io:5000?sessionId=blahblahblabh&name=hogeun/
	@GetMapping
	// public ResponseEntity<JsonObject> getRoom(@RequestParam Map<String, String> sessionName, @RequestParam Map<String, String> nickName) {
	public void getRoom(@RequestParam Map<String, String> sessionName, @RequestParam Map<String, String> nickName) {
				
		sName = (String) sessionName.get("sessionName");
		nName = (String) nickName.get("connectionId");
		
		System.out.println("sessionName: " + sName + ", nickName: " + nName);
		
		// Gson gson = new Gson();
//		JsonObject json = new JsonObject();
//		json.addProperty("sessionName", sName);
//		json.addProperty("nickName", nName);
		
		// return new ResponseEntity<>(json, HttpStatus.OK);
	}
	
	
	

}
