'use client'

import Script from 'next/script'

export function IntercomWidgetGuest() {
  const intercomAppId = process.env.NEXT_PUBLIC_WIDGET_CHAT_INTERCOM_ID

  if (!intercomAppId) return null

  return (
    <>
      <Script id="intercom-settings-guest" strategy="afterInteractive">
        {`
          window.intercomSettings = {
            api_base: "https://api-iam.intercom.io",
            app_id: "${intercomAppId}"
          };
        `}
      </Script>
      <Script id="intercom-widget-guest" strategy="afterInteractive">
        {`
          (function(){
            var w=window;var ic=w.Intercom;
            if(typeof ic==="function"){
              ic('reattach_activator');ic('update',w.intercomSettings);
            }else{
              var d=document;var i=function(){i.c(arguments);};
              i.q=[];i.c=function(args){i.q.push(args);};
              w.Intercom=i;
              var l=function(){
                var s=d.createElement('script');
                s.type='text/javascript';s.async=true;
                s.src='https://widget.intercom.io/widget/${intercomAppId}';
                var x=d.getElementsByTagName('script')[0];
                x.parentNode.insertBefore(s,x);
              };
              if(document.readyState==='complete'){l();}
              else if(w.attachEvent){w.attachEvent('onload',l);}
              else{w.addEventListener('load',l,false);}
            }
          })();
        `}
      </Script>
    </>
  )
}
