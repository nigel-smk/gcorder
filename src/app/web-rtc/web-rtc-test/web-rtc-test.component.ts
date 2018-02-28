import {
  AfterViewChecked, ApplicationRef, Component, ElementRef, NgZone, OnChanges, OnInit,
  ViewChild
} from '@angular/core';
import {UserMediaService} from '../services/user-media.service';
import {PcmDataService} from '../services/pcm-data.service';
import {Mp3BlobService} from '../services/mp3-blob.service';
import {Observable} from 'rxjs/Observable';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {ClientLoadService} from '../services/client-load.service';
import {GdriveUploadService} from '../services/gdrive-upload.service';

@Component({
  selector: 'app-web-rtc-test',
  templateUrl: './web-rtc-test.component.html',
  styleUrls: ['./web-rtc-test.component.css']
})
export class WebRtcTestComponent implements OnInit, AfterViewChecked {

  public mp3Url$: Observable<String> = Observable.never();

  @ViewChild('playback') playback: ElementRef;
  @ViewChild('playbackSource') playbackSource: ElementRef;
  @ViewChild('playbackSourceStored') playbackSourceStored: ElementRef;
  private prevAudioSrc: String;

  public storedMp3: SafeResourceUrl;
  private accessToken: string;
  public userProfile$: Observable<any>;
  public userProfile;
  public googleAuth$: Observable<any>;
  public googleAuth;


  constructor(private userMedia: UserMediaService,
              private pcmData: PcmDataService,
              private mp3Blob: Mp3BlobService,
              private sanitizer: DomSanitizer,
              private clientLoad: ClientLoadService,
              private gdriveUpload: GdriveUploadService,
              private appRef: ApplicationRef
  ) { }

  ngOnInit() {
    this.gdriveUpload.init();
    this.gdriveUpload.$.subscribe(console.log, console.error);
    this.googleAuth$ = this.clientLoad.$;
    this.googleAuth$.subscribe(auth => this.googleAuth = auth);
    this.userProfile$ = this.clientLoad.$.map(auth => auth.currentUser.get().getBasicProfile());
    // TODO hacking change detection b/c I can't figure out running the auth init in ngZone
    this.userProfile$.subscribe(userProfile => {
      this.userProfile = userProfile;
      this.appRef.tick();
    }, console.error);

    const stored = localStorage.getItem('mp3');
    if (stored) {
      this.storedMp3 = this.sanitizer.bypassSecurityTrustResourceUrl(stored);
      this.playback.nativeElement.load();
    }


    this.userMedia.getUserMedia();

    this.mp3Url$ = this.mp3Blob.$
      .map((blob: Blob) => {
      // TODO put in a function
        const fr = new FileReader();
        fr.onload = (e) => {
          if (e.type === 'load') {
            console.log(fr.result);
            localStorage.setItem('mp3', fr.result);
          }
        };
        fr.readAsDataURL(blob);

        return this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob));
      })
      .do((blob) => console.log(blob), () => console.log('error'), () => console.log('complete'));
  }

  ngAfterViewChecked() {
    if (this.prevAudioSrc !== this.playbackSource.nativeElement.getAttribute('src')) {
      this.prevAudioSrc = this.playbackSource.nativeElement.getAttribute('src');
      this.playback.nativeElement.load();
    }
  }

  start() {
    this.mp3Blob.init();
    this.pcmData.start();
  }

  pause() {
    this.pcmData.pause();
  }

  stop() {
    this.pcmData.stop();
  }

  signIn() {
    this.googleAuth.signIn();
  }

  signOut() {
    this.googleAuth.signOut();
  }

  initUpload() {
    this.appRef.tick();
    // this.gdriveUpload.initData();
    // this.gdriveUpload.initiateSession(this.accessToken);
  }

}
