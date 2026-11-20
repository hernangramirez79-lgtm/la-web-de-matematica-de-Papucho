import re,sys
src=open(sys.argv[1],encoding='utf-8').read()
def parse(s):
    out=[];i=0
    while i<len(s):
        m=None
        for tok in ('PER(','F(','R('):
            if s.startswith(tok,i) and (i==0 or not s[i-1].isalpha() or tok=='PER(' ):
                m=tok;break
        if m:
            j=i+len(m);depth=1;parts=[];cur=j
            while depth:
                c=s[j]
                if c=='(':depth+=1
                elif c==')':
                    depth-=1
                    if depth==0:break
                elif c=='|' and depth==1:
                    parts.append(s[cur:j]);cur=j+1
                j+=1
            parts.append(s[cur:j]);parts=[parse(p) for p in parts]
            if m=='F(':out.append(f'<span class="fr"><span>{parts[0]}</span><span>{parts[1]}</span></span>')
            elif m=='PER(':out.append(f'<span class="per">{parts[0]}</span>')
            else:
                idx=parts[0].strip() if len(parts)>1 else ''
                body=parts[-1]
                pre=f'<sup style="font-size:.65em;margin-right:-.35em">{idx}</sup>' if idx else ''
                out.append(f'<span class="rad">{pre}√<span class="ov">{body}</span></span>')
            i=j+1
        else:
            out.append(s[i]);i+=1
    return ''.join(out)
open(sys.argv[2],'w',encoding='utf-8').write(parse(src))
