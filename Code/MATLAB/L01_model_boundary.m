% MECH321 — Dynamics of Engineering Systems | TYUT 2026
% Paired with the corresponding Python L01 file. Control System Toolbox is required.
% Each script writes its lecture figure to Code/Figures/MATLAB.
clear; close all; clc;
fig = figure('Color','w','Position',[100 100 900 440]);
m=250; k=9000; wn=sqrt(k/m); t=linspace(0,4,1200); x=50*cos(wn*t); plot(t,x,'LineWidth',2); ylabel('Displacement (mm)'); xlabel('Time (s)'); title('Platform free response'); assert(abs(wn-6)<1e-10);
grid on;
out = fullfile(fileparts(fileparts(mfilename('fullpath'))),'Figures','MATLAB');
if ~exist(out,'dir'), mkdir(out); end
exportgraphics(fig,fullfile(out,'L01.png'),'Resolution',200);
disp('L01 complete');
