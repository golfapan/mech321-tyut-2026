% MECH321 — Dynamics of Engineering Systems | TYUT 2026
% Paired with the corresponding Python L07 file. Control System Toolbox is required.
% Each script writes its lecture figure to Code/Figures/MATLAB.
clear; close all; clc;
fig = figure('Color','w','Position',[100 100 900 440]);
s=tf('s'); G=4/(s+2); T=feedback(2*G,1); S=feedback(1,2*G); t=linspace(0,2,1200); plot(t,step(8*T,t),'LineWidth',2); hold on; plot(t,step(S,t),'LineWidth',2); legend('8-unit reference','Unit output disturbance'); xlabel('Time (s)'); ylabel('Output'); title('Tracking and disturbance'); assert(abs(dcgain(T)-0.8)<1e-10);
grid on;
out = fullfile(fileparts(fileparts(mfilename('fullpath'))),'Figures','MATLAB');
if ~exist(out,'dir'), mkdir(out); end
exportgraphics(fig,fullfile(out,'L07.png'),'Resolution',200);
disp('L07 complete');
