% Starter for Project 1 Stage 4, Questions 1–4: fixed-floor free response. Base MATLAB.
clearvars; close all; clc;
folder = fullfile(fileparts(mfilename('fullpath')), 'Plots');
if ~exist(folder,'dir'), mkdir(folder); end
m = 80; k = 18*1000; % 18 kN/m -> N/m
cases = 1000*[1.5]; labels = {'A'}; % Table 4 damping in kN s/m -> N s/m
t = (0:0.001:1.5)'; q0 = [0.010;0];
f = figure('Visible','off','Color','w','Position',[100 100 1400 850]);
hold on; names = cell(numel(cases),1);
colors = [0 .35 .70; .90 .32 .00; .08 .08 .08; .55 .18 .70];
lineStyles = {'-','--','-.',':'};
wn = NaN; % TODO: replace NaN with your natural-frequency expression.
zeta = NaN(size(cases(:))); % TODO: replace with your damping-ratio expression.
options = odeset('RelTol',1e-9,'AbsTol',1e-11,'MaxStep',.001);
X = zeros(numel(t),numel(cases));
for n = 1:numel(cases)
    c = cases(n);
    rhs = @(tt,q) [q(2);(-c*q(2)-k*q(1))/m];
    [~,q] = ode45(rhs,t,q0,options);
    X(:,n) = q(:,1);
    plot(t,1000*q(:,1),'Color',colors(n,:),'LineStyle',lineStyles{n},'LineWidth',1.8);
    names{n} = sprintf('Design %s: c=%g kN s/m',labels{n},c/1000);
end
grid on; xlabel('Time (s)'); ylabel('Seat displacement (mm)');
title('Fixed floor: release from 10 mm at rest');
xlim([0 1.5]); ylim([-11 11]); yline(0,'k:');
legend(names,'Location','southoutside','NumColumns',2,'TextColor','k','Color','w');
set(gca,'FontSize',14,'Color','w','XColor','k','YColor','k');
set(findall(f,'Type','text'),'Color','k');
exportgraphics(f,fullfile(folder,'Project01_FreeDecay.png'),'Resolution',200);
wnText = compose('%.3g',repmat(wn,numel(cases),1));
zetaText = compose('%.3g',zeta);
disp(table(labels(:),cases(:)/1000,wnText,zetaText, ...
    'VariableNames',{'Case','Damping_kNsPerM','NaturalFrequency_radPerS','DampingRatio'}));
writematrix([t X],fullfile(folder,'Project01_FreeDecay.csv'));
