% MECH321 — Dynamics of Engineering Systems | TYUT 2026
% Paired with the corresponding Python L09 file. Control System Toolbox is required.
% Each script writes its lecture figure to Code/Figures/MATLAB.
clear; close all; clc;
fig = figure('Color','w','Position',[100 100 600 600]);
gains=[0.25 1 4 9]; cols=lines(4); for j=1:4, p=roots([1 2 gains(j)]); scatter(real(p),imag(p),80,cols(j,:),'filled'); hold on; end; xline(0); legend('K=0.25','K=1','K=4','K=9'); xlabel('Real part (1/s)'); ylabel('Imaginary part (rad/s)'); title('Closed-loop poles');
grid on; axis equal;
out = fullfile(fileparts(fileparts(mfilename('fullpath'))),'Figures','MATLAB');
if ~exist(out,'dir'), mkdir(out); end
exportgraphics(fig,fullfile(out,'L09.png'),'Resolution',200);
disp('L09 complete');
