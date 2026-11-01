import { readFile,writeFile } from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const data=JSON.parse(await readFile(new URL('PROJECT_TRACKER.json',root),'utf8'));
const items=[...data.baseline,...data.milestones];
const ids=new Set(items.map(item=>item.id));
if(ids.size!==items.length)throw new Error('Duplicate progress IDs.');
for(const item of items){
  if(!data.statusValues.includes(item.status))throw new Error(`Invalid status: ${item.id}`);
  if(item.status==='done'&&!item.evidence.length)throw new Error(`Done milestone needs evidence: ${item.id}`);
  for(const dependency of item.dependsOn||[])if(!ids.has(dependency))throw new Error(`Unknown dependency: ${dependency}`);
}
const days=data.milestones.map(item=>item.date);
if(days.length!==7||days[0]!==data.weekStart||days.at(-1)!==data.targetDeploymentDate)throw new Error('Expected seven scheduled dates.');
for(let i=1;i<days.length;i++)if(Date.parse(days[i])-Date.parse(days[i-1])!==86400000)throw new Error('Dates must be consecutive.');
const done=data.milestones.filter(item=>item.status==='done').length;
const dayLabel=date=>new Date(`${date}T12:00:00+08:00`).toLocaleDateString('en-PH',{timeZone:data.timezone,weekday:'short',month:'short',day:'numeric'});
const lines=['# Project progress','',`Updated: ${data.updatedOn} · ${data.timezone}.`,`Target deployment: ${data.targetDeploymentDate}.`,'',`Foundation: ${data.baseline.filter(item=>item.status==='done').length}/${data.baseline.length} gates complete. Rollout: ${done}/7 daily milestones complete. Counts are gates, not a percentage of engineering effort.`,`Next milestone: **${data.nextMilestone}**. No future milestone is marked complete merely because its scheduled date arrives.`,'','## Foundation evidence',''];
for(const item of data.baseline)lines.push(`- **${item.id}: ${item.title} — ${item.status}.** ${item.evidence.join('; ')}.`);
lines.push('','## Weekly board','','| ID | Date | Milestone | Status | Depends on |','| --- | --- | --- | --- | --- |');
for(const item of data.milestones)lines.push(`| ${item.id} | ${dayLabel(item.date)} | ${item.title} | ${item.status.replaceAll('_',' ')} | ${item.dependsOn.join(', ')} |`);
lines.push('','## Owner decisions','','| ID | Due | Required decision | Status |','| --- | --- | --- | --- |');
for(const decision of data.decisions)lines.push(`| ${decision.id} | ${decision.due} | ${decision.title} | ${decision.status} |`);
lines.push('','## Evidence and blockers','');
for(const item of data.milestones){lines.push(`### ${item.id} — ${item.title}`,...(item.evidence.length?item.evidence.map(e=>`- Evidence: ${e}`):['- Evidence: not completed yet.']),...(item.blockers.length?item.blockers.map(b=>`- Blocker: ${b}`):['- Recorded blockers: none yet; owner decisions and dependencies above remain pending.']), '');}
lines.push('This board is generated from PROJECT_TRACKER.json. Update that tracker after verified work, then run `node scripts/project-progress.mjs`. Planned tasks and owner approvals are never completed automatically.');
await writeFile(new URL('PROJECT_PROGRESS.md',root),lines.join('\n')+'\n');
const gantt=['gantt','    title Adriano’s delivery system — November 2–8, 2026','    dateFormat YYYY-MM-DD','    axisFormat %b %d','    tickInterval 1day','    todayMarker off','    section Seven-day rollout'];
for(const item of data.milestones){const flag=item.status==='done'?'done, ':item.status==='in_progress'?'active, ':'';gantt.push(`    ${item.title} :${flag}${item.id.toLowerCase()}, ${item.date}, 1d`);}
gantt.push('    section Continuous work','    Checks and preview reviews :checks, 2026-11-02, 6d','    Store and rider guide :guide, 2026-11-06, 2d');
await writeFile(new URL('PROJECT_GANTT.mmd',root),gantt.join('\n')+'\n');
const roadmapUrl=new URL('PROJECT_ROADMAP.md',root);
const roadmap=await readFile(roadmapUrl,'utf8');
if(!roadmap.includes('<!-- gantt:start -->')||!roadmap.includes('<!-- gantt:end -->'))throw new Error('Roadmap chart markers are missing.');
await writeFile(roadmapUrl,roadmap.replace(/<!-- gantt:start -->[\s\S]*?<!-- gantt:end -->/,`<!-- gantt:start -->\n\x60\x60\x60mermaid\n${gantt.join('\n')}\n\x60\x60\x60\n<!-- gantt:end -->`));
console.log(`Progress generated: foundation ${data.baseline.filter(item=>item.status==='done').length}/3; weekly milestones ${done}/7.`);
