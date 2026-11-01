% MECH321 — Dynamics of Engineering Systems | TYUT 2026
% Paired with the corresponding Python L06 file. Control System Toolbox is required.
% Each script writes its lecture figure to Code/Figures/MATLAB.
clear; close all; clc;
fig = figure('Color','w','Position',[100 100 900 440]);
G=tf(0.1,[0.004 0.100 0.410]); t=linspace(0,2,1200); y=step(10*G,t); plot(t,y,'LineWidth',2); hold on; yline(10*dcgain(G),'--'); xlabel('Time (s)'); ylabel('Speed (rad/s)'); title('Full motor model'); assert(abs(dcgain(G)-0.1/0.41)<1e-10);
grid on;
out = fullfile(fileparts(fileparts(mfilename('fullpath'))),'Figures','MATLAB');
if ~exist(out,'dir'), mkdir(out); end
exportgraphics(fig,fullfile(out,'L06.png'),'Resolution',200);
disp('L06 complete');
