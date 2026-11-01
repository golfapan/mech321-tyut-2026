% MECH321 — Dynamics of Engineering Systems | TYUT 2026
% Paired with the corresponding Python L02 file. Control System Toolbox is required.
% Each script writes its lecture figure to Code/Figures/MATLAB.
clear; close all; clc;
fig = figure('Color','w','Position',[100 100 900 440]);
m=4; c=8; k=80; t=linspace(0,2,2500); r=@(u) 0.015*(1-cos(2*pi*u/0.35)).*(u>=0 & u<=0.35); rd=@(u) (0.03*pi/0.35)*sin(2*pi*u/0.35).*(u>=0 & u<=0.35); ode=@(u,z) [z(2);(c*(rd(u)-z(2))+k*(r(u)-z(1)))/m]; [tt,z]=ode45(ode,t,[0;0]); plot(t,1000*r(t),'LineWidth',2); hold on; plot(tt,1000*z(:,1),'LineWidth',2); legend('Moving base r','Mass x'); xlabel('Time (s)'); ylabel('Displacement (mm)'); title('Base excitation');
grid on;
out = fullfile(fileparts(fileparts(mfilename('fullpath'))),'Figures','MATLAB');
if ~exist(out,'dir'), mkdir(out); end
exportgraphics(fig,fullfile(out,'L02.png'),'Resolution',200);
disp('L02 complete');
