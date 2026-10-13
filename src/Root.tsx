import React from 'react';
import {AbsoluteFill, Composition, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import defaults from '../config/video.json';

type Scene = {duration:number; title:string; subtitle:string; media:null | {type:'image'|'video';src:string}};
export type VideoProps = {width:number;height:number;fps:number;background:string;accent:string;scenes:Scene[]};

const Shot:React.FC<{scene:Scene;accent:string}> = ({scene,accent}) => {
  const frame=useCurrentFrame();
  const progress=interpolate(frame,[0,Math.min(15,scene.duration-1)],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <AbsoluteFill style={{padding:'8%',justifyContent:'center',gap:36}}>
    {scene.media && <div style={{height:'48%',overflow:'hidden',borderRadius:20}}>
      {scene.media.type==='video' ? <OffthreadVideo src={staticFile(scene.media.src)} style={{width:'100%',height:'100%',objectFit:'contain'}}/> : <Img src={staticFile(scene.media.src)} style={{width:'100%',height:'100%',objectFit:'contain'}}/>}
    </div>}
    <div style={{opacity:progress,transform:`translateY(${(1-progress)*35}px)`}}>
      <div style={{width:60,height:8,background:accent,marginBottom:36}}/>
      <h1 style={{fontSize:88,lineHeight:1.05,letterSpacing:-3,margin:0,overflowWrap:'anywhere'}}>{scene.title}</h1>
      <p style={{fontSize:36,lineHeight:1.4,color:'#bcbcbc',marginTop:28}}>{scene.subtitle}</p>
    </div>
  </AbsoluteFill>;
};

export const Video:React.FC<VideoProps> = ({scenes,background,accent}) => {
  let from=0;
  return <AbsoluteFill style={{backgroundColor:background,color:'white',fontFamily:'Arial, sans-serif'}}>
    {scenes.map((scene,index)=>{const start=from;from+=scene.duration;return <Sequence key={index} from={start} durationInFrames={scene.duration}><Shot scene={scene} accent={accent}/></Sequence>;})}
  </AbsoluteFill>;
};

export const Root:React.FC = () => <Composition id="ProductVideo" component={Video} defaultProps={defaults as VideoProps} width={defaults.width} height={defaults.height} fps={defaults.fps} durationInFrames={defaults.scenes.reduce((n,s)=>n+s.duration,0)} calculateMetadata={({props})=>({width:props.width,height:props.height,fps:props.fps,durationInFrames:props.scenes.reduce((n,s)=>n+s.duration,0)})}/>;
