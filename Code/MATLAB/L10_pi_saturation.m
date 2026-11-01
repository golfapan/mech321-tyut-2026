% MECH321 — Dynamics of Engineering Systems | TYUT 2026
% Paired with the corresponding Python L10 file. Control System Toolbox is required.
% Each script writes its lecture figure to Code/Figures/MATLAB.
clear; close all; clc;
fig = figure('Color','w','Position',[100 100 900 440]);
dt=0.002; t=0:dt:5; limit=1.5; y=zeros(2,numel(t)); for mode=1:2, integ=0; for j=2:numel(t), e=1-y(mode,j-1); raw=6*e+integ; u=max(-limit,min(limit,raw)); if mode==1 || abs(raw)<=limit || sign(e)~=sign(raw), integ=integ+12*e*dt; end; y(mode,j)=y(mode,j-1)+dt*(-y(mode,j-1)+u); end; end; plot(t,ones(size(t)),'--'); hold on; plot(t,y(1,:),'LineWidth',2); plot(t,y(2,:),'LineWidth',2); legend('Command','No anti-windup','With anti-windup'); xlabel('Time (s)'); ylabel('Output'); title('PI saturation');
grid on;
out = fullfile(fileparts(fileparts(mfilename('fullpath'))),'Figures','MATLAB');
if ~exist(out,'dir'), mkdir(out); end
exportgraphics(fig,fullfile(out,'L10.png'),'Resolution',200);
disp('L10 complete');
