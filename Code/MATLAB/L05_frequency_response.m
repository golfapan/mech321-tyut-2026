% MECH321 — Dynamics of Engineering Systems | TYUT 2026
% Paired with the corresponding Python L05 file. Control System Toolbox is required.
% Each script writes its lecture figure to Code/Figures/MATLAB.
clear; close all; clc;
fig = figure('Color','w','Position',[100 100 900 440]);
G=tf([80 1000],[10 80 1000]); w=logspace(-1,2.3,500); mag=squeeze(abs(freqresp(G,w))); semilogx(w,mag,'LineWidth',2); hold on; yline(1,'--'); xline(20,':'); xlabel('Frequency (rad/s)'); ylabel('|X/R|'); title('Base transmissibility'); assert(abs(squeeze(abs(freqresp(G,20)))-0.555)<0.002);
grid on;
out = fullfile(fileparts(fileparts(mfilename('fullpath'))),'Figures','MATLAB');
if ~exist(out,'dir'), mkdir(out); end
exportgraphics(fig,fullfile(out,'L05.png'),'Resolution',200);
disp('L05 complete');
