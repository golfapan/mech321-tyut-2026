% MECH321 — Dynamics of Engineering Systems | TYUT 2026
% Paired with the corresponding Python L03 file. Control System Toolbox is required.
% Each script writes its lecture figure to Code/Figures/MATLAB.
clear; close all; clc;
fig = figure('Color','w','Position',[100 100 900 440]);
G=tf(1,[2 8 50]); t=linspace(0,4,1200); y=step(10*G,t); plot(t,y,'LineWidth',2); hold on; yline(0.2,'--'); xlabel('Time (s)'); ylabel('Displacement (m)'); title('10 N force step'); assert(abs(dcgain(10*G)-0.2)<1e-10);
grid on;
out = fullfile(fileparts(fileparts(mfilename('fullpath'))),'Figures','MATLAB');
if ~exist(out,'dir'), mkdir(out); end
exportgraphics(fig,fullfile(out,'L03.png'),'Resolution',200);
disp('L03 complete');
